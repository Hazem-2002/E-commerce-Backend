const CartModel = require("../models/cart.model");
const CartItemModel = require("../models/cartItem.model");
const ProductModel = require("../models/product.model");
const CouponModel = require("../models/coupon.model");

const ApiFeatures = require("../utils/apiFeatures");
const ApiError = require("../utils/apiError");

const addToCartService = async ({
  userId,
  productId,
  variants = [],
  quantity = 1,
}) => {
  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  let cartItem = null;

  const session = await CartModel.startSession();

  try {
    await session.withTransaction(async () => {
      let cart = await CartModel.findOne({ user: userId }).session(session);

      if (!cart) {
        cart = new CartModel({
          user: userId,
          quantity: 0,
          totalPrice: 0,
          totalDiscount: 0,
          totalPriceAfterDiscount: 0,
        });

        await cart.save({ session });
      }

      cartItem = await CartItemModel.findOne({
        cart: cart._id,
        product: productId,
      }).session(session);

      if (!cartItem) {
        cartItem = new CartItemModel({
          cart: cart._id,
          product: productId,
          quantity: 0,
          totalItemPrice: 0,
          totalItemPriceAfterDiscount: 0,
          totalItemDiscount: 0,
          variants: [],
        });
      }

      const {
        totalQuantity,
        total_price,
        total_price_after_discount,
        total_discount,
      } = addProductVariantsToCart(cartItem, product, variants, quantity);

      cartItem.quantity += totalQuantity;
      cartItem.totalItemPrice += total_price;
      cartItem.totalItemPriceAfterDiscount += total_price_after_discount;
      cartItem.totalItemDiscount += total_discount;

      await cartItem.save({ session });

      calcCartPriceAndQuantity(
        cart,
        totalQuantity,
        total_price,
        total_price_after_discount,
        total_discount,
      );

      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }

  await cartItem.populate({
    path: "product",
    select: "name price priceAfterDiscount quantity",
  });

  return cartItem;
};

const getCartItemsService = async (query, userId) => {
  const myCart = await CartModel.findOne({ user: userId });

  if (!myCart) {
    throw new ApiError(404, "Cart not found for the user.");
  }

  await recalculateCart(myCart);

  const apiFeatures = new ApiFeatures(
    CartItemModel.find({ cart: myCart._id }),
    query,
  );

  apiFeatures
    .filter()
    .search()
    .paginate(await CartItemModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate([
      {
        path: "product",
        select: "-productImages -variants -colors",
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

  const cartItems = await apiFeatures.query;

  const cart = (
    await myCart.populate({ path: "user", select: "name email" })
  ).toObject();

  cart.cartItems = cartItems;

  delete cart.__v;

  return { cart, paginatedResults: apiFeatures.paginatedResults };
};

const updateCartItemService = async (
  userId,
  productId,
  variantId,
  quantity,
) => {
  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  let cartItem = null;

  const session = await CartModel.startSession();

  try {
    await session.withTransaction(async () => {
      const cart = await CartModel.findOne({ user: userId }).session(session);

      if (!cart) {
        throw new ApiError(404, "Cart not found for the user.");
      }

      cartItem = await CartItemModel.findOne({
        cart: cart._id,
        product: productId,
      }).session(session);

      if (!cartItem) {
        throw new ApiError(
          404,
          "Cart item not found for the specified product in the user's cart.",
        );
      }

      const {
        totalQuantity,
        total_price,
        total_price_after_discount,
        total_discount,
      } = updateProductVariantsInCart(cartItem, product, variantId, quantity);

      cartItem.quantity += totalQuantity;
      cartItem.totalItemPrice += total_price;
      cartItem.totalItemPriceAfterDiscount += total_price_after_discount;
      cartItem.totalItemDiscount += total_discount;

      if (cartItem.quantity <= 0) {
        await CartItemModel.deleteOne({ _id: cartItem._id }).session(session);
      } else {
        await cartItem.save({ session });
      }

      calcCartPriceAndQuantity(
        cart,
        totalQuantity,
        total_price,
        total_price_after_discount,
        total_discount,
      );

      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }
  return cartItem.quantity > 0 ? cartItem : null;
};

const removeFromCartService = async (userId, productId, variantId) => {
  const product = await ProductModel.findById(productId);

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  const session = await CartModel.startSession();

  let cartItem = null;

  try {
    await session.withTransaction(async () => {
      const cart = await CartModel.findOne({ user: userId }).session(session);

      if (!cart) {
        throw new ApiError(404, "Cart not found for the user.");
      }

      cartItem = await CartItemModel.findOne({
        cart: cart._id,
        product: productId,
      }).session(session);

      if (!cartItem) {
        throw new ApiError(
          404,
          "Cart item not found for the specified product in the user's cart.",
        );
      }

      const {
        totalQuantity,
        total_price,
        total_price_after_discount,
        total_discount,
      } = removeProductVariantsFromCart(cartItem, product, variantId);

      cartItem.quantity -= totalQuantity;
      cartItem.totalItemPrice -= total_price;
      cartItem.totalItemPriceAfterDiscount -= total_price_after_discount;
      cartItem.totalItemDiscount -= total_discount;

      if (cartItem.quantity <= 0) {
        await CartItemModel.deleteOne({ _id: cartItem._id }).session(session);
      } else {
        await cartItem.save({ session });
      }

      calcCartPriceAndQuantity(
        cart,
        -totalQuantity,
        -total_price,
        -total_price_after_discount,
        -total_discount,
      );

      await cart.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return cartItem.quantity > 0 ? cartItem : null;
};

const clearCartService = async (userId) => {
  let cart;
  const session = await CartModel.startSession();

  try {
    cart = await CartModel.findOne({ user: userId }).session(session);

    if (!cart) {
      throw new ApiError(404, "Cart not found for the user.");
    }

    await CartItemModel.deleteMany({ cart: cart._id }).session(session);

    cart.quantity = 0;
    cart.totalPrice = 0;
    cart.totalPriceAfterDiscount = 0;
    cart.totalDiscount = 0;

    await cart.save({ session });
  } finally {
    await session.endSession();
  }

  return cart;
};

const applyCouponToCartService = async (userId, code) => {
  const coupon = await CouponModel.findOne({ code });

  if (!coupon) {
    throw new ApiError(404, "Coupon not found. Please provide a valid coupon.");
  }

  if (coupon.expiresAt < new Date()) {
    throw new ApiError(
      400,
      "Coupon has expired. Please provide a valid coupon.",
    );
  }

  const cart = await CartModel.findOne({ user: userId });

  if (!cart) {
    throw new ApiError(404, "Cart not found for the user.");
  }

  if (cart.coupon && cart.coupon.couponId) {
    throw new ApiError(
      400,
      "A coupon has already been applied to the cart. Please remove the existing coupon before applying a new one.",
    );
  }
  const priceAfterDiscount = cart.totalPriceAfterDiscount ?? cart.totalPrice;

  cart.coupon = {
    couponId: coupon._id,
    code: coupon.code,
    discount: coupon.discount,
    expiresAt: coupon.expiresAt,
  };

  const discountAmount = (priceAfterDiscount * coupon.discount) / 100;

  cart.totalPriceAfterDiscount = priceAfterDiscount - discountAmount;

  cart.totalDiscount += discountAmount;

  await cart.save();

  return cart;
};

const removeCouponFromCartService = async (userId) => {
  const cart = await CartModel.findOne({ user: userId });

  if (!cart) {
    throw new ApiError(404, "Cart not found for the user.");
  }

  if (!cart.coupon || !cart.coupon.couponId || !cart.coupon.discount) {
    throw new ApiError(400, "No coupon has been applied to the cart.");
  }

  const priceAfterDiscount = await CartItemModel.aggregate([
    { $match: { cart: cart._id } },
    {
      $group: {
        _id: null,
        totalPriceAfterDiscount: { $sum: "$totalItemPriceAfterDiscount" },
      },
    },
  ]);

  if (!priceAfterDiscount || priceAfterDiscount.length === 0) {
    throw new ApiError(400, "Cart is empty. Cannot apply coupon.");
  }

  const discountAmount =
    (priceAfterDiscount[0].totalPriceAfterDiscount * cart.coupon.discount) /
    100;

  cart.totalPriceAfterDiscount = cart.totalPriceAfterDiscount + discountAmount;

  cart.totalDiscount -= discountAmount;

  cart.coupon = null;

  await cart.save();
};

const addProductVariantsToCart = (
  cartItem,
  product,
  variants = [],
  quantity = 1,
) => {
  if (variants.length === 0 && product.variants.length > 0) {
    if (product.variants.length === 1) {
      variants.push(product.variants[0]);
    } else {
      throw new ApiError(
        400,
        `Product '${product.name}' has multiple variants. Please select a variant.`,
      );
    }
  } else if (variants.length > 0 && product.variants.length === 0) {
    throw new ApiError(
      400,
      `Product '${product.name}' does not have any variants. Please do not select any variants.`,
    );
  }

  let totalQuantity = 0;
  let total_price = 0;
  let total_price_after_discount = 0;

  if (product.variants.length > 0) {
    variants.forEach((selectedVariant) => {
      const productVariant = product.variants.find((pv) => {
        return pv._id.toString() === selectedVariant.variantId;
      });

      if (!productVariant) {
        throw new ApiError(
          400,
          `Product '${product.name}' does not have a variant with ID '${selectedVariant.variantId}'`,
        );
      }

      const existingVariant = cartItem.variants.find(
        (variant) => variant.variantId.toString() === selectedVariant.variantId,
      );

      if (
        (existingVariant &&
          existingVariant.quantity + (selectedVariant.quantity || quantity) >
            productVariant.quantity) ||
        (!existingVariant &&
          (selectedVariant.quantity || quantity) > productVariant.quantity)
      ) {
        if (productVariant.color?.color && productVariant.size) {
          throw new ApiError(
            400,
            `Not enough stock for product '${product.name}' with color '${productVariant.color.color}' and size '${productVariant.size}'. Available Stock: ${productVariant.quantity}`,
          );
        } else if (productVariant.color?.color && !productVariant.size) {
          throw new ApiError(
            400,
            `Not enough stock for product '${product.name}' with color '${productVariant.color.color}'. Available Stock: ${productVariant.quantity}`,
          );
        } else if (!productVariant.color?.color && productVariant.size) {
          throw new ApiError(
            400,
            `Not enough stock for product '${product.name}' with size '${productVariant.size}'. Available Stock: ${productVariant.quantity}`,
          );
        } else {
          throw new ApiError(
            400,
            `Not enough stock for product '${product.name}'. Available Stock: ${productVariant.quantity}`,
          );
        }
      }

      if (existingVariant) {
        existingVariant.quantity += selectedVariant.quantity || quantity;
      } else {
        cartItem.variants.push({
          ...productVariant.toObject(),
          variantId: selectedVariant.variantId,
          quantity: selectedVariant.quantity || quantity,
        });
      }

      totalQuantity += selectedVariant.quantity || quantity;

      total_price +=
        (selectedVariant.quantity || quantity) *
        (productVariant.price || product.price);

      total_price_after_discount +=
        (selectedVariant.quantity || quantity) *
        (productVariant.priceAfterDiscount || product.priceAfterDiscount);
    });
  } else {
    if (cartItem.quantity + quantity > product.quantity) {
      throw new ApiError(
        400,
        `Not enough stock for product '${product.name}'. Available Stock: ${product.quantity}`,
      );
    }

    totalQuantity += quantity;
    total_price += quantity * product.price;
    total_price_after_discount += quantity * product.priceAfterDiscount;
  }

  return {
    totalQuantity,
    total_price,
    total_price_after_discount,
    total_discount: total_price - total_price_after_discount,
  };
};

const updateProductVariantsInCart = (
  cartItem,
  product,
  variantId,
  quantity,
) => {
  if (
    product.variants.length > 1 &&
    cartItem.variants.length > 1 &&
    !variantId
  ) {
    throw new ApiError(
      400,
      `Specify the variants you want to update for product '${product.name}' as it has multiple variants in the cart.`,
    );
  } else if (
    product.variants.length > 1 &&
    cartItem.variants.length === 1 &&
    !variantId
  ) {
    variantId = cartItem.variants[0].variantId.toString();
  } else if (
    product.variants.length === 1 &&
    cartItem.variants.length === 1 &&
    !variantId
  ) {
    variantId = cartItem.variants[0].variantId.toString();
  } else if (product.variants.length > 0 && cartItem.variants.length === 0) {
    throw new ApiError(
      400,
      `cartItem does not have any variants for product '${product.name}'.`,
    );
  }

  if (!quantity && quantity !== 0) {
    throw new ApiError(
      400,
      `Please provide a valid quantity for product '${product.name}'.`,
    );
  } else if (quantity < 0) {
    throw new ApiError(400, `Quantity cannot be negative.`);
  }

  let totalQuantity = 0;
  let total_price = 0;
  let total_price_after_discount = 0;

  if (product.variants.length > 0) {
    const productVariant = product.variants.find((pv) => {
      return pv._id.toString() === variantId;
    });

    if (!productVariant) {
      throw new ApiError(
        400,
        `Product '${product.name}' does not have a variant with ID '${variantId}'`,
      );
    }

    const existingVariant = cartItem.variants.find(
      (variant) => variant.variantId.toString() === variantId,
    );

    if (!existingVariant) {
      throw new ApiError(
        400,
        `Product '${product.name}'${getVariantDescription(productVariant)} is not in the cart.`,
      );
    }

    if (quantity > productVariant.quantity) {
      throw new ApiError(
        400,
        `Not enough stock for product '${product.name}'${getVariantDescription(
          productVariant,
        )}. Available Stock: ${productVariant.quantity}`,
      );
    }

    if (quantity === 0) {
      cartItem.variants = cartItem.variants.filter((variant) => {
        const shouldRemove = variant.variantId.toString() === variantId;

        if (shouldRemove) {
          totalQuantity = -variant.quantity;
          total_price = -(variant.price || product.price) * variant.quantity;
          total_price_after_discount =
            -(variant.priceAfterDiscount || product.priceAfterDiscount) *
            variant.quantity;
        }

        return !shouldRemove;
      });
    } else {
      const diff = quantity - existingVariant.quantity;

      existingVariant.quantity = quantity;

      totalQuantity = diff;
      total_price = diff * (productVariant.price || product.price);
      total_price_after_discount =
        diff *
        (productVariant.priceAfterDiscount || product.priceAfterDiscount);
    }
  } else {
    if (quantity > product.quantity) {
      throw new ApiError(
        400,
        `Not enough stock for product '${product.name}'. Available Stock: ${product.quantity}`,
      );
    } else {
      const diff = quantity - cartItem.quantity;

      totalQuantity = diff;
      total_price = diff * product.price;
      total_price_after_discount = diff * product.priceAfterDiscount;
    }
  }

  return {
    totalQuantity,
    total_price,
    total_price_after_discount,
    total_discount: total_price - total_price_after_discount,
  };
};

const removeProductVariantsFromCart = (cartItem, product, variantId) => {
  if (
    product.variants.length > 1 &&
    cartItem.variants.length > 1 &&
    !variantId
  ) {
    throw new ApiError(
      400,
      `Specify the variants you want to remove for product '${product.name}' as it has multiple variants in the cart.`,
    );
  } else if (product.variants.length > 1 && cartItem.variants.length === 0) {
    throw new ApiError(
      400,
      `Product '${product.name}' has multiple variants, but no one in the cart.`,
    );
  } else if (product.variants.length === 0 && variantId) {
    throw new ApiError(
      400,
      `Product '${product.name}' does not have any variants. Please do not specify a variant to remove.`,
    );
  } else if (
    product.variants.length > 1 &&
    cartItem.variants.length === 1 &&
    !variantId
  ) {
    variantId = cartItem.variants[0].variantId.toString();
  } else if (
    product.variants.length === 1 &&
    cartItem.variants.length === 1 &&
    !variantId
  ) {
    variantId = cartItem.variants[0].variantId.toString();
  }

  let totalQuantity = 0;
  let total_price = 0;
  let total_price_after_discount = 0;

  if (product.variants.length > 0) {
    const productVariant = product.variants.find((pv) => {
      return pv._id.toString() === variantId;
    });

    if (!productVariant) {
      throw new ApiError(
        400,
        `Product '${product.name}' does not have a variant with ID '${variantId}'`,
      );
    }

    const existingVariant = cartItem.variants.find(
      (variant) => variant.variantId.toString() === variantId,
    );

    if (!existingVariant) {
      throw new ApiError(
        400,
        `Product '${product.name}'${getVariantDescription(productVariant)} is not in the cart.`,
      );
    }

    cartItem.variants = cartItem.variants.filter((cartVariant) => {
      const shouldRemove = variantId === cartVariant.variantId.toString();

      if (shouldRemove) {
        totalQuantity = cartVariant.quantity;
        total_price =
          (cartVariant.price || product.price) * cartVariant.quantity;
        total_price_after_discount =
          (cartVariant.priceAfterDiscount || product.priceAfterDiscount) *
          cartVariant.quantity;
      }

      return !shouldRemove;
    });
  } else {
    totalQuantity = cartItem.quantity;
    total_price = cartItem.totalItemPrice;
    total_price_after_discount = cartItem.totalItemPriceAfterDiscount;
  }

  return {
    totalQuantity,
    total_price,
    total_price_after_discount,
    total_discount: total_price - total_price_after_discount,
  };
};

const getVariantDescription = (productVariant) => {
  const attributes = [];

  if (productVariant.color?.color) {
    attributes.push(`color '${productVariant.color.color}'`);
  }

  if (productVariant.size) {
    attributes.push(`size '${productVariant.size}'`);
  }

  return attributes.length ? ` with ${attributes.join(" and ")}` : "";
};

const calcCartPriceAndQuantity = (
  cart,
  totalQuantity,
  total_price,
  total_price_after_discount,
  total_discount,
) => {
  const couponDiscount = cart.coupon?.discount
    ? (total_price_after_discount * cart.coupon.discount) / 100
    : 0;

  cart.quantity += totalQuantity;

  cart.totalPrice = (cart.totalPrice + total_price).toFixed(2);

  cart.totalPriceAfterDiscount = (
    cart.totalPriceAfterDiscount +
    total_price_after_discount -
    couponDiscount
  ).toFixed(2);

  cart.totalDiscount = (
    cart.totalDiscount +
    total_discount +
    couponDiscount
  ).toFixed(2);
};

const recalculateCart = async (cart) => {
  const cartItems = await CartItemModel.find({ cart: cart._id });

  let totalQuantity = 0;
  let totalPrice = 0;
  let totalPriceAfterDiscount = 0;
  let totalDiscount = 0;

  for (const cartItem of cartItems) {
    const product = await ProductModel.findById(cartItem.product);

    if (!product) {
      await CartItemModel.findByIdAndDelete(cartItem._id);
      continue;
    }

    let itemQuantity = 0;
    let itemPrice = 0;
    let itemPriceAfterDiscount = 0;
    let itemDiscount = 0;

    if (cartItem.variants.length > 0) {
      const validVariants = [];

      for (const variant of cartItem.variants) {
        const productVariant = product.variants.find(
          (pv) => pv._id.toString() === variant.variantId.toString(),
        );

        if (!productVariant) {
          continue;
        }

        if (variant.quantity > productVariant.quantity) {
          variant.quantity = productVariant.quantity;
        }

        variant.price = productVariant.price ?? product.price;

        variant.priceAfterDiscount =
          productVariant.priceAfterDiscount ?? product.priceAfterDiscount;

        if (productVariant.size) {
          variant.size = productVariant.size;
        } else {
          delete variant.size;
        }

        if (productVariant.color && productVariant.color?.color) {
          variant.color = {
            ...variant.color,
            ...productVariant.color,
          };
        } else {
          delete variant.color;
        }

        validVariants.push(variant);

        itemQuantity += variant.quantity;

        itemPrice += variant.quantity * variant.price;

        itemPriceAfterDiscount += variant.quantity * variant.priceAfterDiscount;

        itemDiscount +=
          variant.quantity * (variant.price - variant.priceAfterDiscount);
      }

      cartItem.variants = validVariants;

      if (cartItem.variants.length === 0) {
        await CartItemModel.findByIdAndDelete(cartItem._id);
        continue;
      }
    } else {
      if (cartItem.quantity > product.quantity) {
        cartItem.quantity = product.quantity;
      }

      if (cartItem.quantity <= 0) {
        await CartItemModel.findByIdAndDelete(cartItem._id);
        continue;
      }

      itemQuantity = cartItem.quantity;

      itemPrice = cartItem.quantity * product.price;

      itemPriceAfterDiscount = cartItem.quantity * product.priceAfterDiscount;

      itemDiscount =
        cartItem.quantity * (product.price - product.priceAfterDiscount);
    }

    // Update CartItem
    cartItem.quantity = itemQuantity;
    cartItem.totalItemPrice = itemPrice;
    cartItem.totalItemPriceAfterDiscount = itemPriceAfterDiscount;
    cartItem.totalItemDiscount = itemDiscount;

    await cartItem.save();

    totalQuantity += itemQuantity;
    totalPrice += itemPrice;
    totalPriceAfterDiscount += itemPriceAfterDiscount;
    totalDiscount += itemDiscount;
  }

  // Update Cart
  cart.quantity = totalQuantity;
  cart.totalPrice = totalPrice;
  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  cart.totalDiscount = totalDiscount;

  // Apply Cart Coupon
  if (cart.coupon && cart.coupon?.discount) {
    const couponDiscount =
      (cart.totalPriceAfterDiscount * cart.coupon.discount) / 100;

    cart.totalPriceAfterDiscount -= couponDiscount;

    cart.totalDiscount += couponDiscount;
  }

  await cart.save();
};

module.exports = {
  addToCartService,
  getCartItemsService,
  updateCartItemService,
  removeFromCartService,
  clearCartService,
  applyCouponToCartService,
  removeCouponFromCartService,
};
