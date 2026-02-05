const mongoose = require("mongoose");

const userSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Theme settings
    theme: {
      primaryColor: { type: String, default: "#1e88e5" },
      secondaryColor: { type: String, default: "#64b5f6" },
      accentColor: { type: String, default: "#e3f2fd" },
      backgroundGradient: {
        start: { type: String, default: "#f5f5f5" },
        end: { type: String, default: "#e3f2fd" },
        direction: { type: String, default: "135deg" },
      },
    },
    // Layout settings
    layout: {
      showFamilyMembers: { type: Boolean, default: true },
      showShoppingList: { type: Boolean, default: true },
      showIncomeExpenses: { type: Boolean, default: true },
      dashboardOrder: {
        type: [String],
        default: ["family", "budget", "shopping", "recent"],
      },
    },
    // Component customizations
    components: {
      familyCard: {
        background: {
          type: String,
          default: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
        },
        borderRadius: { type: String, default: "12px" },
        shadow: {
          type: String,
          default: "0 4px 16px rgba(30, 136, 229, 0.15)",
        },
      },
      budgetCard: {
        background: {
          type: String,
          default: "linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)",
        },
        borderRadius: { type: String, default: "12px" },
        shadow: {
          type: String,
          default: "0 4px 16px rgba(106, 27, 154, 0.15)",
        },
      },
      shoppingCard: {
        background: {
          type: String,
          default: "linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)",
        },
        borderRadius: { type: String, default: "12px" },
        shadow: { type: String, default: "0 4px 16px rgba(76, 175, 80, 0.15)" },
      },
      recentActionsCard: {
        background: {
          type: String,
          default: "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)",
        },
        borderRadius: { type: String, default: "12px" },
        shadow: { type: String, default: "0 4px 16px rgba(255, 152, 0, 0.15)" },
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserSettings", userSettingsSchema);
