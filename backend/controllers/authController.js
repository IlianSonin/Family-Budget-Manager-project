const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const editDistance = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  if (a[0] === b[0]) return editDistance(a.slice(1), b.slice(1));
  return (
    1 +
    Math.min(
      editDistance(a.slice(1), b),
      editDistance(a, b.slice(1)),
      editDistance(a.slice(1), b.slice(1)),
    )
  );
};

/**
 * GET /api/auth/me
 */
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  // Validate email format
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  const domain = email.split("@")[1].toLowerCase();
  const commonDomains = [
    "gmail.com",
    "outlook.com",
    "hotmail.com",
    "yahoo.com",
    "icloud.com",
    "aol.com",
  ];

  let isValidDomain = commonDomains.includes(domain);
  if (!isValidDomain) {
    for (let d of commonDomains) {
      if (editDistance(domain, d) <= 1) {
        isValidDomain = true;
        break;
      }
    }
  }
  if (!isValidDomain) {
    return res
      .status(400)
      .json({ message: "Possible email typo, please check the domain" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User created",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE /api/auth/delete
 */
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove user from family
    const Family = require("../models/Family");
    const EditPermission = require("../models/EditPermission");

    await Family.updateMany(
      { members: userObjectId },
      { $pull: { members: userObjectId } },
    );

    // Check if any family is now empty and delete
    const emptyFamilies = await Family.find({ members: { $size: 0 } });
    for (let family of emptyFamilies) {
      await Family.findByIdAndDelete(family._id);
      // Optionally delete related data, but for now skip
    }

    // Delete all permissions for this user
    await EditPermission.deleteMany({ userId: userObjectId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ יצירת JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      message: "Login successful",
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
