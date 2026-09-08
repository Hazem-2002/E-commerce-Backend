const mongoose = require("mongoose");

const parseDuration = require("../utils/parseDuration");

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Associated user is required"],
    },

    token: {
      type: String,
      required: [true, "Token hash is required"],
    },

    expiresAt: {
      type: Date,
      default: () =>
        new Date(
          Date.now() + parseDuration(process.env.JWT_REFRESH_EXPIRES_IN),
        ),
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshTokenModel = mongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshTokenModel;
