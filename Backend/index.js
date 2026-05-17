const express = require("express");
const dotenv = require("dotenv");
const { connectDB } = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");

// Load env
dotenv.config();

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://mern-ecommerce-frontend-d5eg.onrender.com",
    ],
    credentials: true,
  })
);


app.use(cookieParser());
app.use(express.json());

// Routes
const userRouter = require("./Routes/User");
const productRouter = require("./Routes/productRoutes");
const orderRouter = require("./Routes/orderRoutes");
const paymentRouter = require("./Routes/paymentRoutes");

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payments", paymentRouter);

app.get("/", (req, res) => {
  res.send("Server running successfully");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});