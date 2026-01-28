const BudgetItem = require("../models/BudgetItem");
const User = require("../models/User");

// הוספת פריט תקציב (הכנסה / הוצאה)
exports.addItem = async (req, res) => {
  const { type, category, amount, note } = req.body;

  if (!type || !category || !amount) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    // מביאים את המשתמש המחובר דרך הטוקן
    const user = await User.findById(req.userId);

    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    const item = await BudgetItem.create({
      familyId: user.familyId,
      type,
      category,
      amount,
      note,
      date: month,
    });

    res.status(201).json({
      message: "Item added",
      item,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// סיכום חודשי של התקציב
exports.getMonthSummary = async (req, res) => {
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ message: "Missing month" });
  }

  try {
    // שוב – מביאים משפחה דרך המשתמש המחובר
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
