import Customer from "../models/customer.model.js";
import generateToken, { COOKIE_NAME, cookieOptions } from "../utils/generateToken.js";

// Only the fields that are safe to send to the client
const toPublicCustomer = (customer) => ({
  _id: customer._id,
  fullName: customer.fullName,
  email: customer.email,
  phone: customer.phone,
});

// POST /customers/register
export const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body || {};

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields (fullName, email, password, phone) are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Password is hashed by the pre("save") hook in the model
    const customer = await Customer.create({ fullName, email, password, phone });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: toPublicCustomer(customer),
    });
  } catch (error) {
    // Two requests racing past the findOne check hit the unique index instead
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Register error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /customers/login
export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // password has select:false in the schema, so ask for it explicitly
    const customer = await Customer.findOne({ email: email.toLowerCase().trim() }).select("+password");

    // Same message for wrong email and wrong password, so attackers can't tell which emails exist
    if (!customer || !(await customer.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    generateToken(res, customer._id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      customer: toPublicCustomer(customer),
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /customers/me  (protected)
export const getMyProfile = (req, res) => {
  // req.user was attached by the auth middleware
  return res.status(200).json(toPublicCustomer(req.user));
};

// POST /customers/logout  (protected)
export const logoutCustomer = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.status(200).json({ success: true, message: "Logged out successfully" });
};

// PATCH /customers/change-password  (protected, bonus)
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "oldPassword and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const customer = await Customer.findById(req.user._id).select("+password");

    if (!(await customer.comparePassword(oldPassword))) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    if (await customer.comparePassword(newPassword)) {
      return res.status(400).json({ success: false, message: "New password must be different from old password" });
    }

    // Assigning and saving triggers the pre("save") hook, which hashes it
    customer.password = newPassword;
    await customer.save();

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
