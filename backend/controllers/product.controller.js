import Product from "../models/product.model.js";
import isValidObjectId from "../utils/isValidObjectId.js";

// The listing page doesn't show descriptions, so leave them out of GET /products
const LIST_FIELDS = "name price category image stock createdAt";

const SORT_OPTIONS = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  newest: { createdAt: -1 },
};

// Escape regex special characters so a search like "c++" is treated as plain text
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /products
export const createProduct = async (req, res) => {
  try {
    // Only pick known fields, so clients can't set _id, createdAt, etc.
    const { name, description, price, category, image, stock } = req.body || {};

    const product = await Product.create({ name, description, price, category, image, stock });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    // Covers missing fields, price <= 0, negative stock and non-numeric values
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => (err.name === "CastError" ? `${err.path} must be a number` : err.message))
        .join(", ");
      return res.status(400).json({ success: false, message });
    }
    console.error("Create product error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /products?search=&category=&sort=
export const getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;

    // Build the filter from whichever query params were sent
    const filter = {};
    if (typeof search === "string" && search.trim()) {
      filter.name = { $regex: escapeRegex(search.trim()), $options: "i" };
    }
    if (typeof category === "string" && category.trim()) {
      filter.category = category.trim();
    }

    const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

    const products = await Product.find(filter).select(LIST_FIELDS).sort(sortBy);

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /products/:id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
  } catch (error) {
    console.error("Get product error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
