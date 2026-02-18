const User = require("../models/User");
const Family = require("../models/Family");

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const family = await Family.findById(user.familyId);
    if (!family) {
      return res.status(404).json({ message: "Family not found" });
    }

    // Check if user is the family admin
    if (family.adminId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "Only family admin can perform this action" });
    }

    // Attach family to request for convenience
    req.family = family;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
