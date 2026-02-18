const express = require("express");
const router = express.Router();

const reminderController = require("../controllers/reminderController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, reminderController.createReminder);
router.get("/", authMiddleware, reminderController.getReminders);
router.patch(
  "/:id/complete",
  authMiddleware,
  reminderController.completeReminder,
);
router.delete("/:id", authMiddleware, reminderController.deleteReminder);

module.exports = router;
