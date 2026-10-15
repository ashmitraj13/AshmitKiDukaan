import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import isValidObjectId from "../utils/isValidObjectId.js";

// The fields the cart UI needs from each referenced product
const CART_PRODUCT_FIELDS = "name price category image stock";

// Every handler runs after the auth middleware, so req.user is the logged-in
// customer. The user id never comes from the request body or URL.

// Loads the customer's cart with live Product data (latest price and stock)
const loadCart = async (customerId) => {
  const customer = await Customer.findById(customerId).populate({
    path: "cart.product",
    select: CART_PRODUCT_FIELDS,
  });

  // If a product was deleted from the catalogue, populate() gives null; skip it
  return customer.cart.filter((item) => item.product);
};

const stockMessage = (stock) =>
  stock === 0 ? "This product is out of stock" : `Only ${stock} in stock`;

// GET /cart
export const getCart = async (req, res) => {
  try {
    const cart = await loadCart(req.user._id);
    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /cart/:productId  -> adds 1 unit (new row, or +1 on the existing row)
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(productId).select("stock");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Each step is one atomic update whose filter also enforces the rule,
    // so double-clicks can't create duplicate rows or go past stock.

    // 1. Already in the cart and below stock: +1
    const increment = await Customer.updateOne(
      {
        _id: req.user._id,
        cart: { $elemMatch: { product: productId, quantity: { $lt: product.stock } } },
      },
      { $inc: { "cart.$.quantity": 1 } }
    );

    if (increment.matchedCount === 0) {
      // 2. Not in the cart yet: add a row with quantity 1 (if there's any stock)
      const insert =
        product.stock > 0
          ? await Customer.updateOne(
              { _id: req.user._id, "cart.product": { $ne: productId } },
              { $push: { cart: { product: productId, quantity: 1 } } }
            )
          : { matchedCount: 0 };

      // 3. Neither matched: it's already in the cart at the stock limit
      if (insert.matchedCount === 0) {
        return res.status(400).json({ success: false, message: stockMessage(product.stock) });
      }
    }

    const cart = await loadCart(req.user._id);
    return res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /cart/:productId  body: { quantity }
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body || {};

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (typeof quantity !== "number" || !Number.isInteger(quantity)) {
      return res.status(400).json({ success: false, message: "Quantity must be a whole number" });
    }

    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId).select("stock");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Always checked against the latest stock, not what it was when added
    if (quantity > product.stock) {
      return res.status(400).json({ success: false, message: stockMessage(product.stock) });
    }

    const result = await Customer.updateOne(
      { _id: req.user._id, "cart.product": productId },
      { $set: { "cart.$.quantity": quantity } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    const cart = await loadCart(req.user._id);
    return res.status(200).json({ success: true, message: "Cart updated", cart });
  } catch (error) {
    console.error("Update cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /cart/:productId
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Only matches if the product is in the cart
    const result = await Customer.updateOne(
      { _id: req.user._id, "cart.product": productId },
      { $pull: { cart: { product: productId } } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    const cart = await loadCart(req.user._id);
    return res.status(200).json({ success: true, message: "Product removed from cart", cart });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
