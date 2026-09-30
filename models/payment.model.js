const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order is required"],
    },

    provider: {
      type: String,
      enum: ["paymob"],
      required: [true, "Provider is required"],
    },

    paymantIntegrationId: {
      type: Number,
    },

    paymentMethod: {
      type: String,
      trim: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },

    currency: {
      type: String,
      required: [true, "Currency is required"],
      uppercase: true,
      default: "EGP",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      required: [true, "Status is required"],
      default: "pending",
      index: true,
    },

    paymobIntentionId: {
      type: String,
      index: true,
    },

    paymobOrderId: {
      type: Number,
      index: true,
    },

    transactionId: {
      type: Number,
      default: null,
    },

    paymentAttemptedAt: {
      type: Date,
    },

    paidAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
    },

    webhookReceivedAt: {
      type: Date,
    },

    reconciliationAttempts: {
      type: Number,
      default: 0,
    },

    lastInquiryAt: {
      type: Date,
    },

    nextInquiryAt: {
      type: Date,
      default: new Date(Date.now() + parseInt(process.env.PAYMENT_NEXT_INQUIRY_INTERVAL) * 60 * 1000),
    },

    pendingExpiresAt: {
      type: Date,
      default: new Date(Date.now() + parseInt(process.env.PAYMENT_PENDING_DURATION) * 60 * 1000),
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.index({ pendingExpiresAt: 1 }, { expireAfterSeconds: 0 });

const PaymentModel = mongoose.model("Payment", paymentSchema);

module.exports = PaymentModel;
