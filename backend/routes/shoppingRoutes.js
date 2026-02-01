const express = require("express");
const router = express.Router();

const shoppingController = require("../controllers/shoppingController");
const authMiddleware = require("../middleware/authMiddleware");

// Add item to shopping list
router.post("/add", authMiddleware, shoppingController.addItem);

// Get shopping list for family
router.get("/list", authMiddleware, shoppingController.getShoppingList);

// Mark item as purchased
router.put(
  "/mark-purchased",
  authMiddleware,
  shoppingController.markAsPurchased,
);

// Delete item from shopping list
router.delete("/delete", authMiddleware, shoppingController.deleteItem);

// Clear all purchased items
router.post(
  "/clear-purchased",
  authMiddleware,
  shoppingController.clearPurchased,
);

module.exports = router;
