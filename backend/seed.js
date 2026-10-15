// Inserts the sample products, or updates them in place if they already exist.
// Usage: npm run seed            (add missing products, refresh name/description/category/image)
//        npm run seed -- --reset (delete all products first, then insert)
//
// Products are matched by name and updated rather than replaced, so their _id
// stays the same and existing carts, wishlists and orders keep working.
// Price and stock are only set when a product is first created.
//
// Photos: Wikimedia Commons (each file's page at commons.wikimedia.org/wiki/File:<name>
// lists its author and licence). Book covers: Open Library Covers API.
import mongoose from "mongoose";
import Product from "./models/product.model.js";

// Commons thumbnail: hashPath is the "x/xy" folder from the file's upload URL
const commons = (hashPath, file) =>
  `https://thumb.wikimedia.org/wikipedia/commons/thumb/${hashPath}/${file}/960px-${file}`;
const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const products = [
  { name: "Noise Cancelling Headphones", description: "Wireless over-ear headphones with active noise cancellation and 30-hour battery life.", price: 4999, category: "Electronics", image: commons("0/0a", "Bose_QuietComfort_25_Acoustic_Noise_Cancelling_Headphones_with_Carry_Case.jpg"), stock: 25 },
  { name: "Mechanical Keyboard", description: "RGB mechanical keyboard with blue switches and a detachable USB-C cable.", price: 2999, category: "Electronics", image: commons("6/68", "Lingbao_JIGUANSHI_Mechanical_Gaming_Keyboard.jpg"), stock: 10 },
  { name: "Smartphone Stand", description: "Clear acrylic stand for phones and small tablets.", price: 499, category: "Electronics", image: commons("e/e8", "Acrylic_mobile_phone_stands.jpeg"), stock: 60 },
  { name: "Bluetooth Speaker", description: "Portable waterproof speaker with deep bass and 12-hour playtime.", price: 1799, category: "Electronics", image: commons("a/a2", "JBL_Flip_4.jpg"), stock: 4 },
  { name: "Wireless Phone Charger", description: "15W magnetic wireless charging pad with a USB-C cable.", price: 1299, category: "Electronics", image: commons("0/01", "MagSafe_and_USB-C_Cable_Charger_for_iPhone.jpg"), stock: 0 },
  { name: "Classic Denim Jacket", description: "Unisex denim jacket with a relaxed fit and button front.", price: 2499, category: "Fashion", image: commons("0/06", "Jean_jacket.jpg"), stock: 15 },
  { name: "Running Shoes", description: "Lightweight breathable running shoes with cushioned soles.", price: 3499, category: "Fashion", image: commons("8/8b", "Asics_Gel-Cumulus_22.jpg"), stock: 8 },
  { name: "Cotton Crew T-Shirt", description: "Soft 100% cotton crew-neck t-shirt available in bright colours.", price: 599, category: "Fashion", image: commons("d/dc", "%E3%83%8D%E3%82%AA%E3%83%B3%E3%82%AB%E3%83%A9%E3%83%BC_%2848100938172%29.jpg"), stock: 100 },
  { name: "Leather Wallet", description: "Tan genuine leather wallet with a strap closure and card slots.", price: 899, category: "Fashion", image: commons("b/bb", "Leather_Wallet_with_a_Strap_Closure_-_DPLA_-_01e1cfae03bc0ce9106a5a7d5e4a9981_%28page_1%29.jpg"), stock: 3 },
  { name: "Atomic Habits", description: "James Clear's guide to building good habits and breaking bad ones.", price: 499, category: "Books", image: cover("9780735211292"), stock: 40 },
  { name: "The Pragmatic Programmer", description: "Classic book on software craftsmanship, 20th anniversary edition.", price: 1899, category: "Books", image: cover("9780135957059"), stock: 12 },
  { name: "Clean Code", description: "Robert C. Martin's handbook of agile software craftsmanship.", price: 1599, category: "Books", image: cover("9780132350884"), stock: 0 },
  { name: "Ceramic Coffee Mug", description: "350ml white ceramic mug, microwave and dishwasher safe.", price: 349, category: "Home", image: commons("8/88", "High_Altitude_Coffee_%286988667411%29.jpg"), stock: 75 },
  // Smaller than 960px on Commons, so the original file is used instead of a thumbnail
  { name: "LED Desk Lamp", description: "Dimmable bamboo LED desk lamp with eye-protection lighting.", price: 1499, category: "Home", image: "https://upload.wikimedia.org/wikipedia/commons/7/71/Concise_bamboo_eye_protection_LED_desk_lamp.jpg", stock: 20 },
  { name: "Cotton Bedsheet Set", description: "Queen-size 300 thread count bedsheet with two pillow covers.", price: 1999, category: "Home", image: commons("8/8c", "Bed_in_Seattle_hotel.jpg"), stock: 5 },
];

const reset = process.argv.includes("--reset");

try {
  await mongoose.connect(process.env.MONGO_URI);

  if (reset) {
    const { deletedCount } = await Product.deleteMany({});
    console.log(`Deleted ${deletedCount} existing products`);
  }

  const result = await Product.bulkWrite(
    products.map(({ price, stock, ...details }) => ({
      updateOne: {
        filter: { name: details.name },
        update: { $set: details, $setOnInsert: { price, stock } },
        upsert: true,
      },
    }))
  );
  console.log(`Inserted ${result.upsertedCount} products, updated ${result.modifiedCount}`);
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
