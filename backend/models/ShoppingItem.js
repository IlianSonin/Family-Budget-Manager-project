const mongoose = require("mongoose");

const shoppingItemSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    boughtBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    boughtAt: {
      type: Date,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: String,
      default: "1",
    },
    note: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
    date: {
      type: String, // YYYY-MM
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ShoppingItem", shoppingItemSchema);
