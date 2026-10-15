import Razorpay from "razorpay";

let client = null;

// Created on first use rather than at import, so the rest of ShopKart still
// starts if the Razorpay keys haven't been added to .env yet
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env");
  }

  if (!client) {
    client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET, // stays on the server, never sent to React
    });
  }
  return client;
};

export default getRazorpay;
