import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";
import { COOKIE_NAME } from "../utils/generateToken.js";

// Protects routes: only requests with a valid JWT cookie get through
const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const customer = await Customer.findById(decoded.id);
    if (!customer) {
      return res.status(401).json({ success: false, message: "Unauthorized: customer not found" });
    }

    req.user = customer;
    next();
  } catch (error) {
    // jwt.verify throws for expired, tampered or malformed tokens
    return res.status(401).json({ success: false, message: "Unauthorized: invalid or expired token" });
  }
};

export default protect;
