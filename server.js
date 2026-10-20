require("dotenv").config();
const express = require("express");
const connectDB = require("./config/db_config");

const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const mongoSanitize = require('@exortek/express-mongo-sanitize');

const mountRoutes = require("./routers");
const globalErrorHandler = require("./middlewares/globalErrorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Set query parser to 'extended' to support nested objects in query parameters
app.set("query parser", "extended");

// Middlewares
app.use(cors());
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Sanitize data to prevent NoSQL injection attacks
app.use(mongoSanitize());

// Mount all routers
mountRoutes(app);

// Global error handling middleware
app.use(globalErrorHandler);

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.name} - ${err.message}`);
  server.close(() => {
    console.error("Server closed due to unhandled rejection");
    process.exit(1);
  });
});
