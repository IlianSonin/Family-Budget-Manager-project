const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const familyController = require("../controllers/familyController");
router.get("/me", authMiddleware, familyController.getMyFamily);

router.post("/create", authMiddleware, familyController.createFamily);
router.post("/join", authMiddleware, familyController.joinFamily);

module.exports = router;
