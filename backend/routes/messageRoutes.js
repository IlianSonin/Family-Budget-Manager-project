const express = require("express");
const router = express.Router();

const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");

// Send a message
router.post("/send", authMiddleware, messageController.sendMessage);

// Get messages for a permission request
router.get(
  "/permission",
  authMiddleware,
  messageController.getPermissionMessages,
);

// Get all messages for current user
router.get("/my-messages", authMiddleware, messageController.getMyMessages);

// Mark message as read
router.post("/read", authMiddleware, messageController.markAsRead);

// Get unread message count
router.get("/unread-count", authMiddleware, messageController.getUnreadCount);

module.exports = router;
