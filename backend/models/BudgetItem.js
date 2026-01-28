const mongoose = require("mongoose");

const budgetItemSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    date: {
      type: String, // YYYY-MM
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("BudgetItem", budgetItemSchema);
