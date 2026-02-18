const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const authRoutes = require("./routes/authRoutes");
const familyRoutes = require("./routes/familyRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const messageRoutes = require("./routes/messageRoutes");
const shoppingRoutes = require("./routes/shoppingRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const reminderRoutes = require("./routes/reminderRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/budget", budgetRoutes);
app.use("/api/permission", permissionRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reminders", reminderRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

// database
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err));

// server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
