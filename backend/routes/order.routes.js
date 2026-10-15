import { Router } from "express";
import {
  createPaymentOrder,
  verifyPayment,
  getMyOrders,
  getOrderById,
  advanceOrderStatus,
} from "../controllers/order.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Every order route belongs to the logged-in customer
router.use(protect);

router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);

// Bonus: a temporary helper for demoing status progression. Not available in production.
if (process.env.NODE_ENV !== "production") {
  router.patch("/:id/advance-status", advanceOrderStatus);
}

export default router;
