const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  getCouponValidator,
  createCouponValidator,
  updateCouponValidator,
  deleteCouponValidator,
} = require("../middlewares/validators/coupon.validator");
const validate = require("../middlewares/validators/validate");

const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/coupon.controller");

const router = express.Router();

router.use(authenticate, authorize("super-admin", "admin"));

router
  .route("/")
  .get(getCoupons)
  .post(createCouponValidator, validate, createCoupon);

router
  .route("/:couponId")
  .get(getCouponValidator, validate, getCoupon)
  .patch(updateCouponValidator, validate, updateCoupon)
  .delete(deleteCouponValidator, validate, deleteCoupon);

module.exports = router;
