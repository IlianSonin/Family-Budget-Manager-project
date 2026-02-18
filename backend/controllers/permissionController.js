const EditPermission = require("../models/EditPermission");
const BudgetItem = require("../models/BudgetItem");
const User = require("../models/User");
const Family = require("../models/Family");

// Request permission to edit another user's budget item
exports.requestEditPermission = async (req, res) => {
  const { budgetItemId, reason } = req.body;

  if (!budgetItemId) {
    return res.status(400).json({ message: "Missing budgetItemId" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const budgetItem = await BudgetItem.findById(budgetItemId);
    if (!budgetItem) {
      return res.status(404).json({ message: "Budget item not found" });
    }

    // Can't request permission for own items
    if (budgetItem.createdBy.toString() === req.userId) {
      return res
        .status(400)
        .json({ message: "Cannot request permission for your own items" });
    }

    // Check if request already exists and is pending
    const existingRequest = await EditPermission.findOne({
      budgetItemId,
      requestedBy: req.userId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Permission request already exists",
      });
    }

    const permission = await EditPermission.create({
      familyId: user.familyId,
      budgetItemId,
      itemOwner: budgetItem.createdBy,
      requestedBy: req.userId,
      status: "pending",
      reason: reason || "",
    });

    res.status(201).json({
      message: "Permission request sent",
      permission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all edit permission requests for current user's items
exports.getEditRequests = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const requests = await EditPermission.find({
      itemOwner: req.userId,
      status: "pending",
    })
      .populate("requestedBy", "name email")
      .populate("budgetItemId", "category amount type note");

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Approve edit permission request
exports.approveEditPermission = async (req, res) => {
  const { permissionId } = req.body;

  if (!permissionId) {
    return res.status(400).json({ message: "Missing permissionId" });
  }

  try {
    const permission = await EditPermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission request not found" });
    }

    // Check if user is the item owner or family admin
    const user = await User.findById(req.userId);
    const family = await Family.findById(user.familyId);

    const isOwner = permission.itemOwner.toString() === req.userId;
    const isAdmin = family && family.adminId.toString() === req.userId;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Only the item owner or family admin can approve" });
    }

    permission.status = "approved";
    // Set expiration to 24 hours from now
    permission.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await permission.save();

    res.json({
      message: "Permission approved",
      permission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Reject edit permission request
exports.rejectEditPermission = async (req, res) => {
  const { permissionId } = req.body;

  if (!permissionId) {
    return res.status(400).json({ message: "Missing permissionId" });
  }

  try {
    const permission = await EditPermission.findById(permissionId);
    if (!permission) {
      return res.status(404).json({ message: "Permission request not found" });
    }

    // Check if user is the item owner or family admin
    const user = await User.findById(req.userId);
    const family = await Family.findById(user.familyId);

    const isOwner = permission.itemOwner.toString() === req.userId;
    const isAdmin = family && family.adminId.toString() === req.userId;

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Only the item owner or family admin can reject" });
    }

    permission.status = "rejected";
    await permission.save();

    res.json({
      message: "Permission rejected",
      permission,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all permission requests made by current user (pending or approved)
exports.getMyEditRequests = async (req, res) => {
  try {
    const requests = await EditPermission.find({
      requestedBy: req.userId,
    })
      .populate("itemOwner", "name email")
      .populate("budgetItemId", "category amount type note");

    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Check if current user can edit a budget item
exports.canEditItem = async (req, res) => {
  const { budgetItemId } = req.query;

  if (!budgetItemId) {
    return res.status(400).json({ message: "Missing budgetItemId" });
  }

  try {
    const budgetItem = await BudgetItem.findById(budgetItemId);
    if (!budgetItem) {
      return res.status(404).json({ message: "Budget item not found" });
    }

    // Own items can always be edited
    if (budgetItem.createdBy.toString() === req.userId) {
      return res.json({
        canEdit: true,
        reason: "You are the owner",
      });
    }

    // Check if there's an approved permission
    const permission = await EditPermission.findOne({
      budgetItemId,
      requestedBy: req.userId,
      status: "approved",
    });

    if (
      permission &&
      (!permission.expiresAt || permission.expiresAt > new Date())
    ) {
      return res.json({
        canEdit: true,
        reason: "Permission approved",
        expiresAt: permission.expiresAt,
      });
    }

    res.json({
      canEdit: false,
      reason: "No permission",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
