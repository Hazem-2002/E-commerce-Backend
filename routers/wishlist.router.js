const express = require("express");

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const { doubleCsrfProtection } = require("../config/csrf");

const {
  getWishlists,
  toggleWishlist,
} = require("../controllers/wishlist.controller");

const validate = require("../middlewares/validators/validate");
const {
  toggleWishlistValidator,
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

module.exports = router;
