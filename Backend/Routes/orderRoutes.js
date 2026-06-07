const express = require("express");
const {
  placeOrder,
  getUserOrders,
  getAllOrdersAdmin,
  updateOrderStatus,
  handleWebhook,
} = require("../controllers/orderController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();


router.post("/", authMiddleware, placeOrder);
router.get("/", authMiddleware, getUserOrders);
router.get("/admin", authMiddleware, getAllOrdersAdmin);
router.put("/:id", authMiddleware, updateOrderStatus);
router.post("/webhook", handleWebhook);

module.exports = router;