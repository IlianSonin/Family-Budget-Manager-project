const BudgetItem = require("../models/BudgetItem");
const User = require("../models/User");

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
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const actions = await BudgetItem.find({
      familyId: user.familyId,
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json(actions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
