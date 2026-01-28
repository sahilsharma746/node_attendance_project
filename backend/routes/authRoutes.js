const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;


    if (!name || !email || !password) {
      return res.status(400).json({ 
        msg: "Please provide name, email, and password" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists with this email" });
    }

    const validRoles = ["admin", "employee", "user"];
    const userRole = role && validRoles.includes(role) ? role : "user";

    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: userRole 
    });

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      msg: "Server error during registration",
      error: error.message 
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        msg: "Please provide email and password" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      msg: "Server error during login",
      error: error.message 
    });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ 
      msg: "Server error",
      error: error.message 
    });
  }
});

router.get("/users", auth, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ 
      msg: "Server error",
      error: error.message 
    });
  }
});

module.exports = router;
