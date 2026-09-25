const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const OrderModel = require("../models/order.model");
const CartModel = require("../models/cart.model");
const CartItemModel = require("../models/cartItem.model");
const ProductModel = require("../models/product.model");
const UserModel = require("../models/users.model");
const AddressModel = require("../models/address.model");

const { clearCartService } = require("./cart.service");

const createOrderService = async ({ userId, addressId, shippingAddress }) => {
  const cart = await CartModel.findOne({ user: userId });

  if (!cart) {
    throw new ApiError(
      404,
      "Cart not found. Please add items to your cart before placing an order.",
    );
  }

  const cartItems = await CartItemModel.find({ cart: cart._id });

  if (cartItems.length === 0) {
    throw new ApiError(
      400,
      "Your cart is empty. Please add items to your cart before placing an order.",
    );
  }

  const address = shippingAddress
    ? shippingAddress
    : addressId
      ? await AddressModel.findOne({ _id: addressId, user: userId })
      : await AddressModel.findOne({ user: userId, isDefault: true });

  if (!address) {
    throw new ApiError(
      404,
      "Address not found. Please add a default address or specify an address for the order.",
    );
  }

  const user = await UserModel.findById(userId).lean();

  const productIds = cartItems.map((item) => item.product);

  const products = await ProductModel.find({
    _id: { $in: productIds },
  }).populate([
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
    { path: "category", select: "name" },
  ]);

  const productsMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  const taxRate = 0.14;
  const shippingPrice = 70;

  const order = new OrderModel({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },

    cartItems: cartItems.map((item) => {
      const product = productsMap.get(item.product.toString());

      if (!product) {
        throw new ApiError(
          404,
          `Product with ID ${item.product} not found. Please remove this item from your cart.`,
        );
      }

      return {
        product,
        quantity: item.quantity,
        variants: item.variants,
        totalItemPrice: item.totalItemPrice,
        totalItemDiscount: item.totalItemDiscount,
        totalItemPriceAfterDiscount: item.totalItemPriceAfterDiscount,
      };
    }),
    shippingAddress: address,
    coupon: cart.coupon || null,
    totalPrice: +cart.totalPrice.toFixed(2),
    totalPriceAfterDiscount: +cart.totalPriceAfterDiscount.toFixed(2),
    totalDiscount: +cart.totalDiscount.toFixed(2),
    taxPrice: +(taxRate * cart.totalPriceAfterDiscount).toFixed(2),
    shippingPrice: +shippingPrice.toFixed(2),
    finalPrice: +(
      cart.totalPriceAfterDiscount +
      taxRate * cart.totalPriceAfterDiscount +
      shippingPrice
    ).toFixed(2),
    quantity: cart.quantity,
    paymentMethod: "cash_on_delivery",
  });

  const session = await OrderModel.startSession();

  try {
    await session.withTransaction(async () => {
      await order.save({ session });

      const operations = [];

      for (const item of cartItems) {
        operations.push({
          updateOne: {
            filter: {
              _id: item.product,
              quantity: { $gte: item.quantity },
            },
            update: {
              $inc: {
                sold: item.quantity,
                quantity: -item.quantity,
              },
            },
          },
        });

        for (const variant of item.variants) {
          operations.push({
            updateOne: {
              filter: {
                _id: item.product,
                variants: {
                  $elemMatch: {
                    _id: variant.variantId,
                    quantity: { $gte: variant.quantity },
                  },
                },
              },
              update: {
                $inc: {
                  "variants.$.quantity": -variant.quantity,
                },
              },
            },
          });
        }
      }

      const result = await ProductModel.bulkWrite(operations, {
        session,
      });

      if (result.modifiedCount !== operations.length) {
        throw new ApiError(
          409,
          "Some products or variants in your order are out of stock or do not have sufficient quantity. Please review your cart and try again.",
        );
      }
    });

    await clearCartService(userId, session);
  } finally {
    await session.endSession();
  }

  return order;
};

const getUserOrdersService = async (query, userId) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found. Please check the user ID.");
  }

  const apiFeatures = new ApiFeatures(
    OrderModel.find({ "user._id": userId }),
    query,
  );

  apiFeatures
    .filter()
    .search("user.name", "user.email", "user.phone", "cartItems.product.name")
    .paginate(await OrderModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate([
      { path: "cartItems.product.brand", select: "name" },
      { path: "cartItems.product.subcategories", select: "name" },
      { path: "cartItems.product.category", select: "name" },
    ]);

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const orders = await apiFeatures.query;

  return { orders, paginatedResults: apiFeatures.paginatedResults };
};

const getOrdersService = async (query) => {
  const apiFeatures = new ApiFeatures(OrderModel.find(), query);

  apiFeatures
    .filter()
    .search("user.name", "user.email", "user.phone", "cartItems.product.name")
    .paginate(await OrderModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate([
      { path: "cartItems.product.brand", select: "name" },
      { path: "cartItems.product.subcategories", select: "name" },
      { path: "cartItems.product.category", select: "name" },
    ]);

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const orders = await apiFeatures.query;

  return { orders, paginatedResults: apiFeatures.paginatedResults };
};

const getOrderByIdService = async (orderId) => {
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found. Please check the order ID.");
  }

  await order.populate([
    { path: "cartItems.product.brand", select: "name" },
    { path: "cartItems.product.subcategories", select: "name" },
    { path: "cartItems.product.category", select: "name" },
  ]);

  return order;
};

const updateOrderStatusService = async (orderId, newStatus) => {
  const order = await OrderModel.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found. Please check the order ID.");
  }

  order.orderStatus = newStatus;

  await order.save();
};

module.exports = {
  createOrderService,
  getUserOrdersService,
  getOrdersService,
  getOrderByIdService,
  updateOrderStatusService,
};
