// middleware/adminMiddleware.js

const UserModel = require("../models/User");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.userId);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error during admin check",
    });
  }
};

module.exports = adminMiddleware;