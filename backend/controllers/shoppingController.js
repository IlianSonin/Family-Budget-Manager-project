const ShoppingItem = require("../models/ShoppingItem");
const User = require("../models/User");
const BudgetItem = require("../models/BudgetItem");

// Add item to shopping list
exports.addItem = async (req, res) => {
  const { name, quantity, note, price } = req.body;

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
      price: price || 0,
      date: new Date().toISOString().slice(0, 7), // YYYY-MM
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
  const { month } = req.query;

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    let query = { familyId: user.familyId };

    // Filter by month if provided
    if (month) {
      const startOfMonth = new Date(month + "-01");
      const endOfMonth = new Date(
        startOfMonth.getFullYear(),
        startOfMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      query.$or = [
        { date: month }, // New items with date field
        {
          date: { $exists: false }, // Old items without date field
          createdAt: {
            $gte: startOfMonth,
            $lte: endOfMonth,
          },
        },
      ];
    }

    const items = await ShoppingItem.find(query)
      .populate("createdBy", "name")
      .populate("boughtBy", "name")
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

    const wasPurchased = item.isPurchased;
    item.isPurchased = isPurchased !== false;

    // Track who bought the item and when
    if (!wasPurchased && item.isPurchased) {
      item.boughtBy = req.userId;
      item.boughtAt = new Date();
    }

    // If item is being marked as purchased and has a price, create budget expense
    if (!wasPurchased && item.isPurchased && item.price > 0) {
      const month = new Date().toISOString().slice(0, 7);
      const budgetItemData = {
        familyId: user.familyId,
        createdBy: req.userId, // Who performed the action (for activity log)
        attributedTo: item.createdBy, // Who it should count for in stats (requester)
        type: "expense",
        category: "Shopping",
        amount: item.price,
        note: `Bought: ${item.name}${item.quantity && item.quantity !== "1" ? ` (${item.quantity})` : ""}`,
        date: month,
      };

      console.log("🛒 Creating BudgetItem:", {
        itemName: item.name,
        buyerId: req.userId,
        requesterId: item.createdBy,
        budgetItemData,
      });

      const createdBudgetItem = await BudgetItem.create(budgetItemData);

      // Verify the item was saved correctly
      const savedItem = await BudgetItem.findById(createdBudgetItem._id)
        .populate("createdBy", "name")
        .populate("attributedTo", "name");

      console.log("💾 VERIFIED BudgetItem saved to DB:", {
        id: savedItem._id,
        amount: savedItem.amount,
        category: savedItem.category,
        createdBy:
          savedItem.createdBy?.name + " (" + savedItem.createdBy?._id + ")",
        attributedTo:
          savedItem.attributedTo?.name +
          " (" +
          savedItem.attributedTo?._id +
          ")",
        note: savedItem.note,
        fullDoc: savedItem,
      });
    }

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
