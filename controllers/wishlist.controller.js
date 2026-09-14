const asyncWrapper = require("../utils/asyncWrapper");
const ApiError = require("../utils/apiError");
const httpStatusText = require("../utils/httpStatusText");

const {
  getWishlistsService,
  toggleWishlistService,
} = require("../services/wishlist.service");

const getWishlists = asyncWrapper(async (req, res, next) => {
  const { wishlists, paginatedResults } = await getWishlistsService(req.query);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { wishlists },
  });
});

const toggleWishlist = asyncWrapper(async (req, res, next) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const { message, wishlist } = await toggleWishlistService(userId, productId);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message,
    data: { wishlist },
  });
});

module.exports = {
  getWishlists,
  toggleWishlist,
};
