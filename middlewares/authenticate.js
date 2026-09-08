const jwt = require("jsonwebtoken");

const UsersModel = require("../models/users.model");

const ApiError = require("../utils/apiError");

const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next(new ApiError(401, "Access denied. No token provided."));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    const user = await UsersModel.findById(decoded.id).select(
      "_id name email role passwordChangedAt",
    );

    if (!user) {
      return next(new ApiError(401, "Access denied. User not found."));
    }

    if (
      user.passwordChangedAt &&
      user.passwordChangedAt > new Date(decoded.iat * 1000)
    ) {
      return next(
        new ApiError(
          401,
          "Authorization failed. Password has been changed. Please log in again.",
        ),
      );
    }

    delete user.passwordChangedAt;
    req.user = user;

    next();
  } catch (err) {
    return next(new ApiError(401, "Invalid token."));
  }
};

module.exports = authenticate;
