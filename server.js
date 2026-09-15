const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db_config");
const apiError = require("./utils/apiError");
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
app.use(express.json());
app.use(cookieParser());

// Mount all routers
mountRoutes(app);

app.all("/*splat", (req, res, next) => {
  return next(
    new apiError(404, `Can't find ${req.originalUrl} on this server!`),
  );
});

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
