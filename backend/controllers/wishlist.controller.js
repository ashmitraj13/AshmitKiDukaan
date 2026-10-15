import Customer from "../models/customer.model.js";
import Product from "../models/product.model.js";
import isValidObjectId from "../utils/isValidObjectId.js";

// The fields the wishlist UI needs from each referenced product
const WISHLIST_FIELDS = "name price category image stock";

// Every handler here runs after the auth middleware, so req.user is the
// logged-in customer. The user id never comes from the request body or URL.

// POST /wishlist/:productId
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    if (!(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // One atomic update: only matches if the product isn't already saved,
    // so even two requests at the same moment can't create a duplicate
    const result = await Customer.updateOne(
      { _id: req.user._id, wishlist: { $ne: productId } },
      { $addToSet: { wishlist: productId } }
    );

    if (result.matchedCount === 0) {
      return res.status(409).json({ success: false, message: "Product already in wishlist" });
    }

    return res.status(201).json({ success: true, message: "Product added to wishlist" });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /wishlist
export const getWishlist = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: WISHLIST_FIELDS,
    });

    // populate() leaves out references to products that were deleted
    const wishlist = customer.wishlist;

    return res.status(200).json({ success: true, count: wishlist.length, wishlist });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /wishlist/ids
// Lightweight version without populate: lets product cards know which are
// already saved, and gives the navbar its count
export const getWishlistIds = (req, res) => {
  const productIds = req.user.wishlist;
  return res.status(200).json({ success: true, count: productIds.length, productIds });
};

// DELETE /wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    // Only matches if the product is in the wishlist. (Checking modifiedCount
    // alone isn't enough: timestamps also bumps updatedAt on every update.)
    const result = await Customer.updateOne(
      { _id: req.user._id, wishlist: productId },
      { $pull: { wishlist: productId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Product not in wishlist" });
    }

    return res.status(200).json({ success: true, message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
