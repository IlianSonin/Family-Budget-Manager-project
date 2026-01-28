const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const authRoutes = require("./routes/authRoutes");
const familyRoutes = require("./routes/familyRoutes");
const budgetRoutes = require("./routes/budgetRoutes");

const app = express();
const PORT = 3000;

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/budget", budgetRoutes);

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
