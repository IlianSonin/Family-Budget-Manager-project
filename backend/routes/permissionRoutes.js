const express = require("express");
const router = express.Router();

const permissionController = require("../controllers/permissionController");
const authMiddleware = require("../middleware/authMiddleware");

// Request permission to edit another user's item
router.post(
  "/request",
  authMiddleware,
  permissionController.requestEditPermission,
);

// Get all edit requests for current user's items
router.get("/pending", authMiddleware, permissionController.getEditRequests);

// Get all edit requests made by current user
router.get(
  "/my-requests",
  authMiddleware,
  permissionController.getMyEditRequests,
);

// Approve edit permission
router.post(
  "/approve",
  authMiddleware,
  permissionController.approveEditPermission,
);

// Reject edit permission
router.post(
  "/reject",
  authMiddleware,
  permissionController.rejectEditPermission,
);

// Check if user can edit an item
router.get("/can-edit", authMiddleware, permissionController.canEditItem);

module.exports = router;
