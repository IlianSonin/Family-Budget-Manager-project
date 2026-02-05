const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.delete("/delete", auth, authController.deleteAccount);
router.get("/me", auth, authController.me);

module.exports = router;
