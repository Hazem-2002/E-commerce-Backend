const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      required: [true, "Token purpose is required"],
      enum: ["password-reset"],
      trim: true,
    },

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
      required: [true, "Expiration time is required"],
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: "Token has expired",
      },
    },
  },
  { timestamps: true },
);

resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ResetTokenModel = mongoose.model("ResetToken", resetTokenSchema);

module.exports = ResetTokenModel;
