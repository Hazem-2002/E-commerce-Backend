const express = require("express");

const authenticate = require("../middlewares/authenticate");

const {
  addToCartValidators,
  updateCartItemValidators,
  removeFromCartValidators,
} = require("../middlewares/validators/cart.validator");

const validate = require("../middlewares/validators/validate");

const {
  addToCart,
  getCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
} = require("../controllers/cart.controller");

const router = express.Router();

router.use(authenticate);

router.route("/add").post(addToCartValidators, validate, addToCart);

router.route("/my-cart").get(getCartItems);

router
  .route("/update")
  .patch(updateCartItemValidators, validate, updateCartItem);

router
  .route("/remove")
  .delete(removeFromCartValidators, validate, removeFromCart);

router.route("/clear").delete(clearCart);

router.route("/apply-coupon").post(applyCoupon);

router.route("/remove-coupon").delete(removeCoupon);

module.exports = router;
