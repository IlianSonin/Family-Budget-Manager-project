const ShoppingItem = require("../models/ShoppingItem");
const User = require("../models/User");

// Add item to shopping list
exports.addItem = async (req, res) => {
  const { name, quantity, note } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Item name is required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const item = await ShoppingItem.create({
      familyId: user.familyId,
      createdBy: req.userId,
      name,
      quantity: quantity || "1",
      note: note || "",
    });

    const populatedItem = await item.populate("createdBy", "name");

    res.status(201).json({
      message: "Item added to shopping list",
      item: populatedItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get shopping list for family
exports.getShoppingList = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const items = await ShoppingItem.find({ familyId: user.familyId })
      .populate("createdBy", "name")
      .sort({ isPurchased: 1, createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark item as purchased
exports.markAsPurchased = async (req, res) => {
  const { itemId, isPurchased } = req.body;

  if (!itemId) {
    return res.status(400).json({ message: "Item ID is required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const item = await ShoppingItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Verify item belongs to user's family
    if (item.familyId.toString() !== user.familyId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    item.isPurchased = isPurchased !== false;
    await item.save();

    const populatedItem = await item.populate("createdBy", "name");

    res.json({
      message: "Item updated",
      item: populatedItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete item from shopping list
exports.deleteItem = async (req, res) => {
  const { itemId } = req.body;

  if (!itemId) {
    return res.status(400).json({ message: "Item ID is required" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const item = await ShoppingItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Verify item belongs to user's family
    if (item.familyId.toString() !== user.familyId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await ShoppingItem.findByIdAndDelete(itemId);

    res.json({ message: "Item deleted from shopping list" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear all purchased items
exports.clearPurchased = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const result = await ShoppingItem.deleteMany({
      familyId: user.familyId,
      isPurchased: true,
    });

    res.json({
      message: `Cleared ${result.deletedCount} purchased items`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
