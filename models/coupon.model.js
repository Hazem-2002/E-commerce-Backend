const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Coupon code is required"],
      trim: true,
      unique: true,
    },
    discount: {
      type: Number,
      required: [true, "Discount is required"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
    },
  },
  { timestamps: true },
);

couponSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

couponSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const CouponModel = mongoose.model("Coupon", couponSchema);

module.exports = CouponModel;
