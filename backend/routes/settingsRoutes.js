const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");

// Get user settings
router.get("/", authMiddleware, settingsController.getUserSettings);

// Update user settings
router.put("/", authMiddleware, settingsController.updateUserSettings);

// Reset user settings to default
router.post("/reset", authMiddleware, settingsController.resetUserSettings);

module.exports = router;
