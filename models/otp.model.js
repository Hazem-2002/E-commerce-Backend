const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      required: [true, "OTP purpose is required"],
      enum: ["email-verification", "password-reset"],
      trim: true,
    },
    otp: {
      type: String,
      required: [true, "OTP is required"],
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "OTP expiration time is required"],
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: "OTP has expired",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Associated user is required"],
    },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTPModel = mongoose.model("OTP", otpSchema);

module.exports = OTPModel;
