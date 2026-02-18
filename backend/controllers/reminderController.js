const Reminder = require("../models/Reminder");
const User = require("../models/User");
const Family = require("../models/Family");

// Create reminder
exports.createReminder = async (req, res) => {
  const { assignedTo, title, note, dueAt } = req.body;

  if (!assignedTo || !title || !dueAt) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    // Verify assignedTo is in the same family
    const assignedUser = await User.findById(assignedTo);
    if (
      !assignedUser ||
      assignedUser.familyId.toString() !== user.familyId.toString()
    ) {
      return res
        .status(400)
        .json({ message: "Assigned user is not in your family" });
    }

    const reminder = await Reminder.create({
      familyId: user.familyId,
      createdBy: req.userId,
      assignedTo,
      title,
      note,
      dueAt: new Date(dueAt),
    });

    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get reminders for current user
exports.getReminders = async (req, res) => {
  const { month } = req.query;

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    let query = {
      familyId: user.familyId,
      assignedTo: req.userId,
    };

    // Optional month filter
    if (month) {
      const startOfMonth = new Date(`${month}-01T00:00:00.000Z`);
      const endOfMonth = new Date(startOfMonth);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      query.dueAt = { $gte: startOfMonth, $lt: endOfMonth };
    }

    const reminders = await Reminder.find(query)
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .sort({ dueAt: 1 });

    res.json(reminders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark reminder as complete
exports.completeReminder = async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    // Only assignedTo or creator can complete
    if (
      reminder.assignedTo.toString() !== req.userId &&
      reminder.createdBy.toString() !== req.userId
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    reminder.isDone = true;
    await reminder.save();

    res.json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete reminder
exports.deleteReminder = async (req, res) => {
  const { id } = req.params;

  try {
    const reminder = await Reminder.findById(id);
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    // Only creator can delete
    if (reminder.createdBy.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Only creator can delete reminder" });
    }

    await Reminder.findByIdAndDelete(id);
    res.json({ message: "Reminder deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
