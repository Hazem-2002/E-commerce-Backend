const CouponModel = require("../models/coupon.model");

const ApiFeatures = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");

const getCouponsService = async (query) => {
  const apiFeatures = new ApiFeatures(CouponModel.find(), query);

  apiFeatures
    .filter()
    .search("code")
    .paginate(await CouponModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields();

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const coupons = await apiFeatures.query;

  return { coupons, paginatedResults: apiFeatures.paginatedResults };
};

const getCouponService = async ({ couponId, code }) => {
  let coupon;
  if (couponId) {
    coupon = await CouponModel.findById(couponId);
  } else if (code) {
    coupon = await CouponModel.findOne({ code });
  } else {
    throw new ApiError(
      400,
      "Please provide either a coupon ID or a coupon code to retrieve the coupon.",
    );
  }
  if (!coupon) {
    throw new ApiError(
      404,
      "Coupon not found. Please check the provided coupon ID or code.",
    );
  }
  return coupon;
};

const CreateCouponService = async (couponData) => {
  const { code, discount, expiresAt } = couponData;

  const existingCoupon = await CouponModel.findOne({ code });
  if (existingCoupon) {
    throw new ApiError(400, "Coupon code already exists");
  }

  const coupon = await CouponModel.create({ code, discount, expiresAt });
  return coupon;
};

const updateCouponService = async (couponId, updateData) => {
  if (updateData.code) {
    const existingCoupon = await CouponModel.findOne({
      code: updateData.code,
      _id: { $ne: couponId },
    });
    if (existingCoupon) {
      throw new ApiError(400, "Coupon code already exists");
    }
  }

  const updatedCoupon = await CouponModel.findByIdAndUpdate(
    couponId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!updatedCoupon) {
    throw new ApiError(
      404,
      "Coupon not found. Please check the provided coupon ID.",
    );
  }

  return updatedCoupon;
};

const deleteCouponService = async ({ couponId, code }) => {
  let deletedCoupon;

  if (couponId) {
    deletedCoupon = await CouponModel.findByIdAndDelete(couponId);
  } else if (code) {
    deletedCoupon = await CouponModel.findOneAndDelete({ code });
  } else {
    throw new ApiError(
      400,
      "Please provide either a coupon ID or a coupon code to delete the coupon.",
    );
  }

  if (!deletedCoupon) {
    throw new ApiError(
      404,
      "Coupon not found. please check the provided coupon ID.",
    );
  }

  return deletedCoupon;
};

module.exports = {
  getCouponsService,
  getCouponService,
  CreateCouponService,
  updateCouponService,
  deleteCouponService,
};
