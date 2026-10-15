import { Router } from "express";
import {
  addToWishlist,
  getWishlist,
  getWishlistIds,
  removeFromWishlist,
} from "../controllers/wishlist.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Every wishlist route belongs to the logged-in customer
router.use(protect);

router.get("/", getWishlist);
router.get("/ids", getWishlistIds);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
