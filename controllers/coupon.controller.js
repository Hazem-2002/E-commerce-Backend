const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const ApiError = require("../utils/apiError");

const {
  getCouponsService,
  getCouponService,
  CreateCouponService,
  updateCouponService,
  deleteCouponService,
} = require("../services/coupon.service");

const getCoupons = asyncWrapper(async (req, res, next) => {
  const { coupons, paginatedResults } = await getCouponsService(req.query);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { coupons },
  });
});

const getCoupon = asyncWrapper(async (req, res, next) => {
  const { couponId } = req.params;

  const coupon = await getCouponService({ couponId });
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: { coupon },
  });
});

const createCoupon = asyncWrapper(async (req, res, next) => {
  const coupon = await CreateCouponService(req.body);
  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Coupon created successfully",
    data: { coupon },
  });
});

const updateCoupon = asyncWrapper(async (req, res, next) => {
  const { couponId } = req.params;

  if ((!req.body || Object.keys(req.body).length === 0) && !req.file) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const updatedCoupon = await updateCouponService(couponId, req.body);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Coupon updated successfully",
    data: { coupon: updatedCoupon },
  });
});

const deleteCoupon = asyncWrapper(async (req, res, next) => {
  const { couponId } = req.params;

  const coupon = await deleteCouponService({ couponId });
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Coupon deleted successfully",
    data: { coupon },
  });
});

module.exports = {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
