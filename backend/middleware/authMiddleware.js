const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Verify user exists in database
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user object to request for potential future use
    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
