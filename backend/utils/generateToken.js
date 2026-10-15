import jwt from "jsonwebtoken";

export const COOKIE_NAME = "token";

export const cookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read this cookie
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict",
};

// Signs a JWT containing the customer id and stores it in an HttpOnly cookie
const generateToken = (res, customerId) => {
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  });

  return token;
};

export default generateToken;
