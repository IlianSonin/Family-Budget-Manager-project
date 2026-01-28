const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const budgetController = require("../controllers/budgetController");

router.post("/add", auth, budgetController.addItem);
router.get("/summary", auth, budgetController.getMonthSummary);

module.exports = router;
