const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminAuth = auth.adminAuth;

// Public registration disabled. Only admins create users via POST /users; users login only.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        msg: "Please provide email and password" 
      });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: emailNormalized });
    if (!user) {
      console.log("[Login] No user found for email:", emailNormalized);
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("[Login] Password mismatch for email:", emailNormalized);
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

// Admin-only: create user (including other admins). Mounted as POST /api/auth/users
router.post("/users", auth, adminAuth, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        msg: "Please provide name, email, and password" 
      });
    }

    const emailNormalized = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists with this email" });
    }

    const validRoles = ["admin", "employee", "user"];
    const userRole = role && validRoles.includes(role) ? role : "employee";

    const user = await User.create({ 
      name: name.trim(), 
      email: emailNormalized, 
      password, 
      role: userRole 
    });

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: "User already exists with this email" });
    }
    const validationMsg = error.message || (error.errors && Object.values(error.errors)[0]?.message);
    res.status(500).json({ 
      msg: validationMsg || "Server error while creating user",
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

// List users: any authenticated user (admin = full list, employee = id/name/role only)
router.get("/users", auth, async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === "admin";
    const users = await User.find()
      .select(isAdmin ? "-password" : "_id name role")
      .sort({ name: 1 })
      .lean();
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      msg: "Server error",
      error: error.message,
    });
  }
});

module.exports = router;
