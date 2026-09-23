const httpStatusText = require("../utils/httpStatusText");
const asyncWrapper = require("../utils/asyncWrapper");

const {
  addToCartService,
  getCartItemsService,
  updateCartItemService,
  removeFromCartService,
  clearCartService,
  applyCouponToCartService,
  removeCouponFromCartService,
} = require("../services/cart.service");

const addToCart = asyncWrapper(async (req, res) => {
  const { productId, variants = [], quantity = 1 } = req.body;

  const cartItem = await addToCartService({
    userId: req.user._id,
    productId,
    variants,
    quantity,
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product added to cart successfully",
    data: { cartItem },
  });
});

const getCartItems = asyncWrapper(async (req, res) => {
  const { cart, paginatedResults } = await getCartItemsService(
    req.query,
    req.user._id,
  );
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { cart },
  });
});

const updateCartItem = asyncWrapper(async (req, res) => {
  const { productId, variantId, quantity } = req.body;

  const cartItem = await updateCartItemService(
    req.user._id,
    productId,
    variantId,
    quantity,
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: cartItem
      ? "Cart item updated successfully"
      : "cart item updated successfully and removed from cart",
    ...(cartItem ? { data: { cartItem } } : {}),
  });
});

const removeFromCart = asyncWrapper(async (req, res) => {
  const { productId, variantId } = req.body;

  const cartItem = await removeFromCartService(
    req.user._id,
    productId,
    variantId,
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Product removed from cart successfully",
    ...(cartItem ? { data: { cartItem } } : {}),
  });
});

const clearCart = asyncWrapper(async (req, res) => {
  await clearCartService(req.user._id);

  const { cart } = await getCartItemsService({}, req.user._id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Cart cleared successfully",
    data: { cart },
  });
});

const applyCoupon = asyncWrapper(async (req, res) => {
  const { couponCode } = req.body;

  await applyCouponToCartService(req.user._id, couponCode);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Coupon applied successfully",
  });
});

const removeCoupon = asyncWrapper(async (req, res) => {
  await removeCouponFromCartService(req.user._id);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Coupon removed successfully",
  });
});

module.exports = {
  addToCart,
  getCartItems,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
};
