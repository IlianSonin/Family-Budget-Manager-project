const bcrypt = require("bcrypt");
const Family = require("../models/Family");
const User = require("../models/User");
const BudgetItem = require("../models/BudgetItem");
const EditPermission = require("../models/EditPermission");
const Message = require("../models/Message");
const ShoppingItem = require("../models/ShoppingItem");

// יצירת משפחה
exports.createFamily = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const family = await Family.create({
      name,
      password: hashedPassword,
      members: [req.userId],
      adminId: req.userId, // Creator becomes the admin
    });

    await User.findByIdAndUpdate(req.userId, {
      familyId: family._id,
    });

    res.status(201).json({
      message: "Family created",
      familyId: family._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// הצטרפות למשפחה
exports.joinFamily = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const family = await Family.findOne({ name });
    if (!family) {
      return res.status(400).json({ message: "Family not found" });
    }

    const isMatch = await bcrypt.compare(password, family.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (!family.members.includes(req.userId)) {
      family.members.push(req.userId);
      await family.save();
    }

    await User.findByIdAndUpdate(req.userId, {
      familyId: family._id,
    });

    res.json({ message: "Joined family successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
// קבלת המשפחה שלי + רשימת חברים
exports.getMyFamily = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const family = await Family.findById(user.familyId)
      .populate("adminId", "name")
      .populate("members", "name email");

    res.json({
      _id: family._id,
      name: family.name,
      members: family.members,
      adminId: family.adminId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN ONLY: Remove member from family
exports.removeMember = async (req, res) => {
  const { memberId } = req.params;

  try {
    const family = req.family;

    // Cannot remove yourself
    if (memberId === req.userId) {
      return res
        .status(400)
        .json({ message: "Cannot remove yourself from family" });
    }

    // Check if member exists in family
    if (!family.members.includes(memberId)) {
      return res.status(404).json({ message: "Member not found in family" });
    }

    // Remove member from family
    family.members = family.members.filter((id) => id.toString() !== memberId);
    await family.save();

    // Clear familyId from user
    await User.findByIdAndUpdate(memberId, { familyId: null });

    // Delete all budget items, permissions, messages, and shopping items for this user in this family
    await BudgetItem.deleteMany({ familyId: family._id, createdBy: memberId });
    await EditPermission.deleteMany({
      $or: [
        { familyId: family._id, requestedBy: memberId },
        { familyId: family._id, itemOwner: memberId },
      ],
    });
    await Message.deleteMany({ familyId: family._id, sender: memberId });
    await ShoppingItem.deleteMany({
      familyId: family._id,
      createdBy: memberId,
    });

    res.json({ message: "Member removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN ONLY: Transfer admin role to another member
exports.transferAdmin = async (req, res) => {
  const { newAdminId } = req.body;

  try {
    const family = req.family;

    // Cannot transfer to yourself
    if (newAdminId === req.userId) {
      return res.status(400).json({ message: "You are already the admin" });
    }

    // Check if new admin is a member of the family
    if (!family.members.includes(newAdminId)) {
      return res
        .status(400)
        .json({ message: "New admin must be a family member" });
    }

    // Update admin
    family.adminId = newAdminId;
    await family.save();

    res.json({ message: "Admin role transferred successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN ONLY: Delete family
exports.deleteFamily = async (req, res) => {
  try {
    const family = req.family;

    // Delete all related data
    await BudgetItem.deleteMany({ familyId: family._id });
    await EditPermission.deleteMany({ familyId: family._id });
    await Message.deleteMany({ familyId: family._id });
    await ShoppingItem.deleteMany({ familyId: family._id });

    // Clear familyId from all members
    await User.updateMany({ familyId: family._id }, { familyId: null });

    // Delete the family
    await Family.findByIdAndDelete(family._id);

    res.json({ message: "Family deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ADMIN ONLY: Get full family statistics and activity
exports.getFamilyStats = async (req, res) => {
  try {
    const family = req.family;
    const { month } = req.query;

    // Get all family members with details
    const members = await User.find(
      { _id: { $in: family.members } },
      "name email",
    );

    // Get budget statistics
    let budgetQuery = { familyId: family._id };
    if (month) {
      budgetQuery.date = month;
    }

    const budgetItems = await BudgetItem.find(budgetQuery).populate(
      "createdBy",
      "name",
    );

    // Calculate total stats
    const totalIncome = budgetItems
      .filter((item) => item.type === "income")
      .reduce((sum, item) => sum + item.amount, 0);

    const totalExpenses = budgetItems
      .filter((item) => item.type === "expense")
      .reduce((sum, item) => sum + item.amount, 0);

    // Get recent activity (last 10 items)
    const recentActivity = await BudgetItem.find({ familyId: family._id })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    // Get permission requests
    const pendingPermissions = await EditPermission.find({
      familyId: family._id,
      status: "pending",
    })
      .populate("requestedBy", "name")
      .populate("itemOwner", "name");

    res.json({
      family: {
        _id: family._id,
        name: family.name,
        adminId: family.adminId,
        memberCount: family.members.length,
        createdAt: family.createdAt,
      },
      members,
      statistics: {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        itemCount: budgetItems.length,
      },
      recentActivity,
      pendingPermissions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
