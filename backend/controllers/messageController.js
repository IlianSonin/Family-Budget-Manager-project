const Message = require("../models/Message");
const User = require("../models/User");

// Send a message
exports.sendMessage = async (req, res) => {
  const { recipientId, permissionId, content } = req.body;

  if (!recipientId || !content) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user || !user.familyId) {
      return res.status(400).json({ message: "User has no family" });
    }

    const message = await Message.create({
      familyId: user.familyId,
      permissionId: permissionId || null,
      senderId: req.userId,
      recipientId,
      content,
    });

    const populatedMessage = await message.populate("senderId", "name");
    await populatedMessage.populate("recipientId", "name");

    res.status(201).json({
      message: "Message sent",
      data: populatedMessage,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get messages for a permission request
exports.getPermissionMessages = async (req, res) => {
  const { permissionId } = req.query;

  if (!permissionId) {
    return res.status(400).json({ message: "Missing permissionId" });
  }

  try {
    const messages = await Message.find({ permissionId })
      .populate("senderId", "name")
      .populate("recipientId", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all messages for current user
exports.getMyMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ senderId: req.userId }, { recipientId: req.userId }],
    })
      .populate("senderId", "name")
      .populate("recipientId", "name")
      .populate("permissionId", "status")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  const { messageId } = req.body;

  if (!messageId) {
    return res.status(400).json({ message: "Missing messageId" });
  }

  try {
    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true },
    );

    res.json({ message: "Message marked as read", data: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipientId: req.userId,
      isRead: false,
    });

    res.json({ unreadCount: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
