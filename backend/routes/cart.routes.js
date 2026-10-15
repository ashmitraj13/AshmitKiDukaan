import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
} from "../controllers/cart.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Every cart route belongs to the logged-in customer
router.use(protect);

router.get("/", getCart);
router.post("/:productId", addToCart);
router.patch("/:productId", updateCartQuantity);
router.delete("/:productId", removeFromCart);

export default router;
