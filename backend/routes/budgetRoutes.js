const express = require("express");
const router = express.Router();

const budgetController = require("../controllers/budgetController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, budgetController.addItem);
router.get("/summary", authMiddleware, budgetController.getMonthSummary);
router.get(
  "/categories",
  authMiddleware,
  budgetController.getCategoriesSummary,
);
router.get("/recent", authMiddleware, budgetController.getRecentActions);
router.get("/member-stats", authMiddleware, budgetController.getMemberStats);
router.put("/edit", authMiddleware, budgetController.editItem);
router.delete("/delete", authMiddleware, budgetController.deleteItem);

module.exports = router;
