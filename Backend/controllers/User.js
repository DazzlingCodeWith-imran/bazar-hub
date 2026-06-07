// controllers/User.js

const UserModel = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// EMAIL TRANSPORT
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ================= REGISTER USER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      isVerified: false,
      role: "user",
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully. OTP sent.",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= REGISTER ADMIN =================
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin secret",
      });
    }

    const existingAdmin = await UserModel.findOne({ email });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
      isVerified: false,
      role: "admin",
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Admin OTP Verification",
      text: `Your OTP is ${otp}`,
    });

    res.status(201).json({
      success: true,
      message: "Admin registered successfully. OTP sent.",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= VERIFY OTP =================
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= LOGIN USER =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await UserModel.findOne({ email });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!existingUser.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify OTP first",
      });
    }

    const token = jwt.sign(
      {
        userId: existingUser._id,
        userEmail: existingUser.email,
        role: existingUser.role,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    // COOKIE SET
    // res.cookie("userToken", token, {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "lax",
    //   maxAge: 24 * 60 * 60 * 1000,
    // });
    res.cookie("userToken", token, {
  httpOnly: true,
  secure: true,       // ← HTTPS ke liye
  sameSite: "None",   // ← cross-domain ke liye
  maxAge: 24 * 60 * 60 * 1000,
});

    // res.status(200).json({
    //   success: true,
    //   message: "Login successful",
    //   data: existingUser,
    // });
    res.status(200).json({
  success: true,
  message: "Login successful",
  data: existingUser,
  token: token,  // ← YEH ADD KARO
});
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= LOGOUT =================
const logoutUser = async (req, res) => {
  try {
    // res.clearCookie("userToken", {
    //   httpOnly: true,
    //   secure: false,
    //   sameSite: "lax",
    // });
    res.clearCookie("userToken", {
  httpOnly: true,
  secure: true,
  sameSite: "None",
});

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= CHECK AUTH =================
const checkAuth = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= PROFILE =================
const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).select("-password");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;

    const user = await UserModel.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) {
      user.name = name;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  registerAdmin,
  loginUser,
  verifyOtp,
  logoutUser,
  checkAuth,
  getProfile,
  updateProfile,
};