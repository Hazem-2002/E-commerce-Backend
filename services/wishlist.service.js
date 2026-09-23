const WishListModel = require("../models/wishlist.model");
const WishlistItemModel = require("../models/wishlistItem.model");
const ProductModel = require("../models/product.model");

const ApiFeatures = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");

const getWishlistsService = async (query) => {
  const apiFeatures = new ApiFeatures(WishListModel.find(), query);

  apiFeatures
    .filter()
    .paginate(await WishListModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate([
      { path: "user", select: "name email role image" },
      {
        path: "products",
        select: "product -wishlist -_id",
        populate: {
          path: "product",
          select:
            "name price priceAfterDiscount sold productCover ratingsAverage ratingsQuantity isFeatured isActive tags",
        },
      },
    ]);

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }
  const wishlists = await apiFeatures.query;

  wishlists.forEach((wishlist) => {
    if (wishlist.products) {
      wishlist.products = wishlist.products?.map(({ product }) => product);
    }
  });

  return {
    wishlists,
    paginatedResults: apiFeatures.paginatedResults,
  };
};

const toggleWishlistService = async (userId, productId) => {
  const existingProduct = await ProductModel.exists({ _id: productId });
  if (!existingProduct) {
    throw new ApiError(404, "Product not found. Please check the provided ID.");
  }

  let wishlist = await WishListModel.findOne({ user: userId });

  if (!wishlist) {
    wishlist = await WishListModel.create({ user: userId });
  }

  const wishlistItem = await WishlistItemModel.findOne({
    wishlist: wishlist._id,
    product: productId,
  });

  if (wishlistItem) {
    await WishlistItemModel.findByIdAndDelete(wishlistItem._id);

    return {
      message: "Product removed from wishlist successfully.",
      wishlist: await wishlist.getWishlistProducts(),
    };
  } else {
    const newWishlistItem = new WishlistItemModel({
      wishlist: wishlist._id,
      product: productId,
    });
    await newWishlistItem.save();

    return {
      message: "Product added to wishlist successfully.",
      wishlist: await wishlist.getWishlistProducts(),
    };
  }
};

const getUserWishlistService = async (query, userId) => {
  const wishlist = await WishListModel.findOne({ user: userId });

  const apiFeatures = new ApiFeatures(
    WishlistItemModel.find({ wishlist: wishlist?._id }),
    query,
  );

  apiFeatures
    .paginate(await WishlistItemModel.countDocuments(apiFeatures.filters))
    .populate([
      {
        path: "product",
        select: "name price priceAfterDiscount sold productCover ratingsAverage ratingsQuantity isFeatured isActive tags",
        populate: [
          { path: "category", select: "name" },
          { path: "subcategories", select: "name" },
          { path: "brand", select: "name" },
        ],
      },
    ]);

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  let wishlistItems = await apiFeatures.query;

  wishlistItems = wishlistItems.map(({ product }) => product);

  return {
    wishlistItems,
    paginatedResults: apiFeatures.paginatedResults,
  };
};

module.exports = {
  getWishlistsService,
  toggleWishlistService,
  getUserWishlistService,
};
