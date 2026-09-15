const {
  codeRule,
  discountRule,
  dateRule,
  mongoIdRule,
} = require("./common/validationRules");

const createCouponValidator = [
  codeRule("code", "Coupon code"),
  discountRule("discount", "Coupon discount"),
  dateRule("expiresAt", "Coupon expiration date"),
];

const updateCouponValidator = [
  mongoIdRule("couponId", "Coupon ID"),
  ...createCouponValidator.map((rule) => rule.optional()),
];

const getCouponValidator = [mongoIdRule("couponId", "Coupon ID")];

const deleteCouponValidator = [mongoIdRule("couponId", "Coupon ID")];

module.exports = {
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
};
