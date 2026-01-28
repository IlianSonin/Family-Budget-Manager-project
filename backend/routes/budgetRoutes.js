const express = require("express");
const router = express.Router();

const budgetController = require("../controllers/budgetController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, budgetController.addItem);
router.get("/summary", authMiddleware, budgetController.getMonthSummary);
router.get("/categories", authMiddleware, budgetController.getCategoriesSummary);
router.get("/recent", authMiddleware, budgetController.getRecentActions);

module.exports = router;
