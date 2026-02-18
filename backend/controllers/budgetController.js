const BudgetItem = require("../models/BudgetItem");
const User = require("../models/User");
const EditPermission = require("../models/EditPermission");
const Family = require("../models/Family");

// הוספת פריט תקציב
exports.addItem = async (req, res) => {
  const { type, category, amount, note } = req.body;

  if (!type || !category || !amount) {
    return res.status(400).json({ message: "Missing fields" });
  }

  if (amount <= 0) {
    return res.status(400).json({ message: "Amount must be positive" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const month = new Date().toISOString().slice(0, 7);

    const item = await BudgetItem.create({
      familyId: user.familyId,
      createdBy: req.userId, // ← זה החסר
      type,
      category,
      amount,
      note,
      date: month,
    });

    res.status(201).json({ message: "Item added", item });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// סיכום חודשי כללי
exports.getMonthSummary = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ message: "Missing month" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const items = await BudgetItem.find({
      familyId: user.familyId,
      date: month,
    });

    const income = items
      .filter((i) => i.type === "income")
      .reduce((sum, i) => sum + i.amount, 0);

    const expenses = items
      .filter((i) => i.type === "expense")
      .reduce((sum, i) => sum + i.amount, 0);

    res.json({
      month,
      income,
      expenses,
      balance: income - expenses,
      items,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🆕 סיכום לפי קטגוריות (הוצאות בלבד)
exports.getCategoriesSummary = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ message: "Missing month" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const summary = await BudgetItem.aggregate([
      {
        $match: {
          familyId: user.familyId,
          date: month,
          type: "expense",
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          total: 1,
        },
      },
      {
        $sort: { total: -1 },
      },
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// פעולות אחרונות
exports.getRecentActions = async (req, res) => {
  const { month } = req.query;

  try {
    const user = await User.findById(req.userId);

    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    let query = { familyId: user.familyId };

    // Filter by month if provided
    if (month) {
      query.date = month;
    }

    const actions = await BudgetItem.find(query)
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Add permission info for each item
    const actionsWithPermissions = await Promise.all(
      actions.map(async (item) => {
        const isOwner =
          item.createdBy && item.createdBy._id.toString() === req.userId;
        let canEdit = isOwner;

        if (!canEdit) {
          const permission = await EditPermission.findOne({
            budgetItemId: item._id,
            requestedBy: req.userId,
            status: "approved",
          });
          canEdit =
            !!permission &&
            (!permission.expiresAt || permission.expiresAt > new Date());
        }

        return {
          ...item.toObject(),
          canEdit,
        };
      }),
    );

    res.json(actionsWithPermissions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit a budget item (with permission checking)
exports.editItem = async (req, res) => {
  const { budgetItemId, category, amount, note } = req.body;

  if (!budgetItemId) {
    return res.status(400).json({ message: "Missing budgetItemId" });
  }

  if (amount !== undefined && amount <= 0) {
    return res.status(400).json({ message: "Amount must be positive" });
  }

  try {
    const budgetItem = await BudgetItem.findById(budgetItemId);
    if (!budgetItem) {
      return res.status(404).json({ message: "Budget item not found" });
    }

    const isOwner = budgetItem.createdBy.toString() === req.userId;

    // Check permission if not owner
    if (!isOwner) {
      const permission = await EditPermission.findOne({
        budgetItemId,
        requestedBy: req.userId,
        status: "approved",
      });

      if (
        !permission ||
        (permission.expiresAt && permission.expiresAt < new Date())
      ) {
        return res.status(403).json({
          message:
            "You don't have permission to edit this item. Request permission from the owner.",
        });
      }
    }

    // Update fields
    if (category !== undefined) budgetItem.category = category;
    if (amount !== undefined) budgetItem.amount = amount;
    if (note !== undefined) budgetItem.note = note;

    // Set editedBy if not owner
    if (!isOwner) {
      budgetItem.editedBy = req.userId;
    }

    await budgetItem.save();

    res.json({
      message: "Item updated successfully",
      item: budgetItem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a budget item (only owner can delete)
exports.deleteItem = async (req, res) => {
  const { budgetItemId } = req.body;

  if (!budgetItemId) {
    return res.status(400).json({ message: "Missing budgetItemId" });
  }

  try {
    const budgetItem = await BudgetItem.findById(budgetItemId);
    if (!budgetItem) {
      return res.status(404).json({ message: "Budget item not found" });
    }

    // Check if user is owner or has approved edit permission
    const isOwner = budgetItem.createdBy.toString() === req.userId;
    let hasPermission = false;

    if (!isOwner) {
      const permission = await EditPermission.findOne({
        budgetItemId: budgetItemId,
        requestedBy: req.userId,
        status: "approved",
      });
      hasPermission =
        !!permission &&
        (!permission.expiresAt || permission.expiresAt > new Date());
    }

    if (!isOwner && !hasPermission) {
      return res.status(403).json({
        message: "You don't have permission to delete this item",
      });
    }

    await BudgetItem.findByIdAndDelete(budgetItemId);

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get member statistics for the current month
exports.getMemberStats = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ message: "Missing month" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    // Get all family members
    const familyMembers = await User.find({ familyId: user.familyId });

    // Get budget items for the month
    const items = await BudgetItem.find({
      familyId: user.familyId,
      date: month,
    })
      .populate("createdBy", "name")
      .populate("attributedTo", "name");

    console.log(
      "📊 All budget items for stats:",
      items.map((item) => ({
        id: item._id,
        amount: item.amount,
        category: item.category,
        createdBy: item.createdBy?.name,
        attributedTo: item.attributedTo?.name,
        note: item.note,
      })),
    );

    // Calculate stats per member
    const memberStats = familyMembers.map((member) => {
      // For stats, use attributedTo if it exists (shopping items), otherwise use createdBy (regular items)
      const memberItems = items.filter((item) => {
        if (item.attributedTo) {
          // Shopping item - use attributedTo (requester)
          return item.attributedTo._id.toString() === member._id.toString();
        } else {
          // Regular item - use createdBy
          return (
            item.createdBy &&
            item.createdBy._id.toString() === member._id.toString()
          );
        }
      });

      console.log(`📊 FINAL STATS for ${member.name} (${member._id}):`, {
        totalItems: memberItems.length,
        totalExpenses: memberItems
          .filter((i) => i.type === "expense")
          .reduce((sum, i) => sum + i.amount, 0),
        items: memberItems.map((item) => ({
          id: item._id,
          amount: item.amount,
          category: item.category,
          type: item.type,
          createdBy: item.createdBy?.name,
          attributedTo: item.attributedTo?.name,
          note: item.note,
          attributionLogic: item.attributedTo
            ? "attributedTo (shopping)"
            : "createdBy (regular)",
        })),
      });

      const income = memberItems
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

      const expenses = memberItems
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

      // Get top categories for this member
      const categoryStats = {};
      memberItems.forEach((item) => {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = 0;
        }
        categoryStats[item.category] += item.amount;
      });

      const topCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, amount]) => ({ category, amount }));

      return {
        userId: member._id,
        name: member.name,
        totalExpenses: expenses,
        totalIncome: income,
        balance: income - expenses,
        itemCount: memberItems.length,
        topCategories,
        incomeCount: memberItems.filter((item) => item.type === "income")
          .length,
        expenseCount: memberItems.filter((item) => item.type === "expense")
          .length,
      };
    });

    console.log(
      "🎯 FINAL MEMBER STATS RESPONSE:",
      memberStats.map((stat) => ({
        name: stat.name,
        totalExpenses: stat.totalExpenses,
        totalIncome: stat.totalIncome,
        itemCount: stat.itemCount,
      })),
    );

    res.json(memberStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get per-person statistics for a month
exports.getMemberStatsDetailed = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ message: "Missing month" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    // Get all family members
    const family = await Family.findById(user.familyId).populate(
      "members",
      "name",
    );
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // Get all budget items for the month
    const items = await BudgetItem.find({
      familyId: user.familyId,
      date: month,
    }).populate("createdBy", "name");

    // Group by user
    const memberStats = family.members.map((member) => {
      const memberItems = items.filter(
        (item) =>
          item.createdBy &&
          item.createdBy._id.toString() === member._id.toString(),
      );

      const totalExpenses = memberItems
        .filter((item) => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

      const totalIncome = memberItems
        .filter((item) => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

      // Get top categories for this member
      const categoryStats = {};
      memberItems.forEach((item) => {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = 0;
        }
        categoryStats[item.category] += item.amount;
      });

      const topCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category, amount]) => ({ category, amount }));

      return {
        userId: member._id,
        name: member.name,
        totalExpenses,
        totalIncome,
        balance: totalIncome - totalExpenses,
        itemCount: memberItems.length,
        topCategories,
      };
    });

    res.json(memberStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
