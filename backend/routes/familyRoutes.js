const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const familyController = require("../controllers/familyController");

router.post("/create", auth, familyController.createFamily);

module.exports = router;
