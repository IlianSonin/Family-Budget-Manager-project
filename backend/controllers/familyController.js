const bcrypt = require("bcrypt");
const Family = require("../models/Family");
const User = require("../models/User");

// יצירת משפחה
exports.createFamily = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const family = await Family.create({
      name,
      password: hashedPassword,
      members: [req.userId],
    });

    await User.findByIdAndUpdate(req.userId, {
      familyId: family._id,
    });

    res.status(201).json({
      message: "Family created",
      familyId: family._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// הצטרפות למשפחה
exports.joinFamily = async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const family = await Family.findOne({ name });
    if (!family) {
      return res.status(400).json({ message: "Family not found" });
    }

    const isMatch = await bcrypt.compare(password, family.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (!family.members.includes(req.userId)) {
      family.members.push(req.userId);
      await family.save();
    }

    await User.findByIdAndUpdate(req.userId, {
      familyId: family._id,
    });

    res.json({ message: "Joined family successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}; 
// קבלת המשפחה שלי + רשימת חברים
exports.getMyFamily = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const family = await Family.findById(user.familyId).populate(
      "members",
      "name email"
    );

    res.json({
      _id: family._id,
      name: family.name,
      members: family.members,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

