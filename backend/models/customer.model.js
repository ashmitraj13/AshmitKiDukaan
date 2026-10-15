import mongoose from "mongoose";
import bcrypt from "bcrypt";

// One row per product; adding the same product again increases quantity instead
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be a whole number",
      },
    },
  },
  { _id: false } // items are identified by their product, so no separate id
);

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      // Never include the password in query results unless explicitly asked with .select("+password")
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    // References to Product documents, not copies, so Product stays the source of truth.
    // Customers created before this field existed simply read it as [].
    wishlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    // Only product references and quantities. Price, stock etc. are read from
    // Product each time, and totals like subtotal are calculated, never stored.
    cart: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Hash the password before saving, but only if it was set or changed
customerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

customerSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Strip the password whenever a document is converted to JSON (e.g. res.json)
customerSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
