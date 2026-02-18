const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireFamilyAdmin = require("../middleware/requireFamilyAdmin");
const familyController = require("../controllers/familyController");

router.get("/my", authMiddleware, familyController.getMyFamily);

router.post("/create", authMiddleware, familyController.createFamily);
router.post("/join", authMiddleware, familyController.joinFamily);

// Admin only routes
router.delete(
  "/members/:memberId",
  authMiddleware,
  requireFamilyAdmin,
  familyController.removeMember,
);
router.post(
  "/transfer-admin",
  authMiddleware,
  requireFamilyAdmin,
  familyController.transferAdmin,
);
router.delete(
  "/",
  authMiddleware,
  requireFamilyAdmin,
  familyController.deleteFamily,
);
router.get(
  "/stats",
  authMiddleware,
  requireFamilyAdmin,
  familyController.getFamilyStats,
);

module.exports = router;
