const express = require("express");

const uploadSingle = require("../middlewares/upload/uploadSingle");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  getUsers,
  getUserById,
  getUserReviews,
  getMe,
  getMyReviews,
  getMyWishlist,
  getUserWishlist,
  updateUser,
  updateMe,
  deleteUser,
  deleteMe,
} = require("../controllers/users.controller");

const {
  getUserByIdValidator,
  getUserReviewsValidator,
  getUserWishlistValidator,
  updateUserValidator,
  updateMeValidator,
  deleteUserValidator,
} = require("../middlewares/validators/users.validator");
const validate = require("../middlewares/validators/validate");

const router = express.Router();

router
  .route("/")
  .get(authenticate, authorize("super-admin", "admin"), getUsers);

router
  .route("/me")
  .get(authenticate, getMe)
  .patch(
    authenticate,
    uploadSingle("profileImage", false),
    updateMeValidator,
    validate,
    updateMe,
  )
  .delete(authenticate, deleteMe);

router.route("/me/reviews").get(authenticate, getMyReviews);

router.route("/me/wishlist").get(authenticate, getMyWishlist);

router
  .route("/:userId")
  .get(
    authenticate,
    authorize("super-admin", "admin"),
    getUserByIdValidator,
    validate,
    getUserById,
  )
  .patch(
    authenticate,
    authorize("super-admin", "admin"),
    uploadSingle("profileImage", false),
    updateUserValidator,
    validate,
    updateUser,
  )
  .delete(
    authenticate,
    authorize("super-admin", "admin"),
    deleteUserValidator,
    validate,
    deleteUser,
  );

router
  .route("/:userId/reviews")
  .get(getUserReviewsValidator, validate, getUserReviews);

router
  .route("/:userId/wishlist")
  .get(
    authenticate,
    authorize("super-admin", "admin"),
    getUserWishlistValidator,
    validate,
    getUserWishlist,
  );

module.exports = router;
