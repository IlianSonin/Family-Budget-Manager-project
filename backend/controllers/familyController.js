const Family = require("../models/Family");
const User = require("../models/User");

exports.createFamily = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Family name is required" });
  }

  try {
    const userId = req.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.familyId) {
      return res.status(400).json({ message: "User already in a family" });
    }

    const family = await Family.create({
      name: name.trim(),
      members: [userId],
    });

    user.familyId = family._id;
    await user.save();

    res.status(201).json({ message: "Family created", familyId: family._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
