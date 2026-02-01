const mongoose = require("mongoose");

const editPermissionSchema = new mongoose.Schema(
  {
    familyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Family",
      required: true,
    },
    budgetItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BudgetItem",
      required: true,
    },
    // The owner of the budget item
    itemOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The user requesting permission
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Status: pending, approved, rejected
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // Reason for the request
    reason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("EditPermission", editPermissionSchema);
