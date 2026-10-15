import crypto from "crypto";
import Customer from "../models/customer.model.js";
import Order, { ORDER_STATUSES } from "../models/order.model.js";
import Product from "../models/product.model.js";
import getRazorpay from "../config/razorpay.js";
import isValidObjectId from "../utils/isValidObjectId.js";
import validateShippingAddress from "../utils/validateShippingAddress.js";

// Every handler runs after the auth middleware, so req.user is the logged-in
// customer. Orders are always looked up together with { user: req.user._id }.

// Constant-time comparison, so the check doesn't leak how many characters matched
const signaturesMatch = (expected, received) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(String(received));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// POST /orders/create-payment-order   body: { shippingAddress }
// Anything else in the body (totalAmount, items, prices...) is ignored.
export const createPaymentOrder = async (req, res) => {
  try {
    const { address, errors } = validateShippingAddress(req.body?.shippingAddress);
    if (Object.keys(errors).length) {
      return res.status(400).json({ success: false, message: "Invalid shipping address", errors });
    }

    // 1. The cart comes from the database, never from the request
    const customer = await Customer.findById(req.user._id).populate({
      path: "cart.product",
      select: "name price image stock",
    });

    if (customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    // 2. Re-check every item against the latest Product data
    for (const { product, quantity } of customer.cart) {
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available. Please review your cart.",
        });
      }
      if (quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message:
            product.stock === 0
              ? `${product.name} is out of stock.`
              : `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
      }
    }

    // 3. Snapshot purchase-time product data and calculate the total here
    const items = customer.cart.map(({ product, quantity }) => ({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
    }));
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 4. Save a pending ShopKart order first, so the Razorpay order can point to it
    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress: address,
      totalAmount,
    });

    // 5. Create the Razorpay order on the server; Razorpay wants paise (₹1 = 100)
    let razorpayOrder;
    try {
      razorpayOrder = await getRazorpay().orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: order._id.toString(),
      });
    } catch (error) {
      console.error("Razorpay order error:", error.error || error.message);
      order.paymentStatus = "FAILED";
      await order.save();
      return res.status(502).json({
        success: false,
        message: "Unable to start payment right now. Your cart has not been changed.",
      });
    }

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    // The cart is deliberately left as it is until payment is verified
    return res.status(201).json({
      success: true,
      shopKartOrderId: order._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID, // the public Key ID only, never the secret
    });
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /orders/verify-payment
// body: { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
export const verifyPayment = async (req, res) => {
  try {
    const { shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!isValidObjectId(String(shopKartOrderId)) || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment details" });
    }

    // Only this customer's own order
    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Verifying twice (e.g. a retried request) just returns the paid order
    if (order.paymentStatus === "PAID") {
      return res.status(200).json({ success: true, message: "Payment already verified", order });
    }

    if (!order.razorpayOrderId || (razorpay_order_id && razorpay_order_id !== order.razorpayOrderId)) {
      return res.status(400).json({ success: false, message: "Payment does not match this order" });
    }

    // An empty secret would make signatures trivial to forge
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("Verify payment error: RAZORPAY_KEY_SECRET is not set");
      return res.status(500).json({ success: false, message: "Payments are not configured" });
    }

    // Razorpay signs "<order_id>|<payment_id>" with our Key Secret. We use the
    // order id stored in our database, not the one the browser sent.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, razorpay_signature)) {
      // Order stays PENDING and the cart is untouched
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Signature is valid: mark paid. The filter makes this happen only once
    // even if two verify requests arrive together.
    const paidOrder = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: { $ne: "PAID" } },
      { $set: { paymentStatus: "PAID", status: "PLACED", razorpayPaymentId: razorpay_payment_id } },
      { new: true }
    );

    if (!paidOrder) {
      const current = await Order.findById(order._id);
      return res.status(200).json({ success: true, message: "Payment already verified", order: current });
    }

    // Only now that payment is confirmed: reduce stock and clear the cart.
    // Stock is only reduced while enough is left, so it never goes negative.
    await Product.bulkWrite(
      paidOrder.items.map((item) => ({
        updateOne: {
          filter: { _id: item.product, stock: { $gte: item.quantity } },
          update: { $inc: { stock: -item.quantity } },
        },
      }))
    );

    await Customer.updateOne({ _id: req.user._id }, { $set: { cart: [] } });

    return res.status(200).json({ success: true, message: "Payment verified, order placed", order: paidOrder });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /orders  -> the current customer's placed orders, newest first
export const getMyOrders = async (req, res) => {
  try {
    // Orders still waiting for payment (e.g. an abandoned checkout) aren't shown
    const orders = await Order.find({ user: req.user._id, status: { $ne: "PENDING_PAYMENT" } })
      .select("items totalAmount status paymentStatus createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    // Filtering by user means someone else's order looks exactly like a
    // missing one (404), so guessing ids reveals nothing
    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /orders/:id/advance-status  (bonus, development only)
// Moves a paid order one step along PLACED -> CONFIRMED -> SHIPPED -> DELIVERED
export const advanceOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid order ID" });
    }

    const order = await Order.findOne({ _id: id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentStatus !== "PAID") {
      return res.status(400).json({ success: false, message: "Only paid orders can progress" });
    }

    const next = ORDER_STATUSES[ORDER_STATUSES.indexOf(order.status) + 1];
    if (!next) {
      return res.status(400).json({ success: false, message: "Order is already delivered" });
    }

    order.status = next;
    await order.save();

    return res.status(200).json({ success: true, message: `Order ${next.toLowerCase()}`, order });
  } catch (error) {
    console.error("Advance order status error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
