const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const { doubleCsrfProtection } = require("../config/csrf");

const {
  getWishlists,
  toggleWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");

const validate = require("../middlewares/validators/validate");
const {
  toggleWishlistValidator,
  addToWishlistValidator,
  removeFromWishlistValidator,
} = require("../middlewares/validators/wishlist.validator");

const router = express.Router();

router
  .route("/")
  .get(
    authenticate,
    doubleCsrfProtection,
    authorize("super-admin", "admin"),
    getWishlists,
  );

router
  .route("/:productId/toggle")
  .patch(
    authenticate,
    doubleCsrfProtection,
    toggleWishlistValidator,
    validate,
    toggleWishlist,
  );

router
  .route("/:productId/add")
  .patch(
    authenticate,
    doubleCsrfProtection,
    addToWishlistValidator,
    validate,
    addToWishlist,
  );

router
  .route("/:productId/delete")
  .patch(
    authenticate,
    doubleCsrfProtection,
    removeFromWishlistValidator,
    validate,
    removeFromWishlist,
  );

module.exports = router;
