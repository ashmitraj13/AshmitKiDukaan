import { Router } from "express";
import { createProduct, getProducts, getProductById } from "../controllers/product.controller.js";

const router = Router();

// Open for now; admin-only protection comes in a later lab
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

export default router;
