const crypto = require("crypto");
const axios = require("axios");
const cron = require("node-cron");

const ApiError = require("../utils/apiError");

const PaymentModel = require("../models/payment.model");
const CartModel = require("../models/cart.model");
const CartItemModel = require("../models/cartItem.model");

const {
  updateOrderService,
  decreaseOrderStockService,
} = require("./order.service");

const { clearCartService } = require("./cart.service");

const createPaymentService = async (intentionData, session = null) => {
  const payment = new PaymentModel({
    user: intentionData.extras.creation_extras.userId,
    order: intentionData.special_reference,
    provider: "paymob",
    amount: intentionData.intention_detail.amount,
    currency: intentionData.intention_detail.currency,
    status:
      intentionData.status === "intended" ? "pending" : intentionData.status,
    paymobIntentionId: intentionData.id,
    paymobOrderId: intentionData.intention_order_id,
  });

  await payment.save(session ? { session } : undefined);
};

const buildPaymobItems = (orderData, cart) => {
  const items = [];

  orderData.cartItems.forEach((item) => {
    if (item.variants && item.variants.length > 0) {
      const variantItems = item.variants.map((variant) => {
        const variantPrice =
          variant.priceAfterDiscount ||
          variant.price ||
          item.product.priceAfterDiscount ||
          item.product.price;

        const variantDiscount = cart.coupon
          ? (cart.coupon.discount / 100) * variantPrice
          : 0;

        const description = [
          variant.size && `Size: ${variant.size}`,
          variant.color?.color && `Color: ${variant.color.color}`,
        ]
          .filter(Boolean)
          .join(" | ");

        return {
          name: item.product.name,
          amount: Math.round((variantPrice - variantDiscount) * 100).toFixed(2),
          ...(description && { description }),
          quantity: variant.quantity,
          image:
            variant.image?.image_url || item.product.productCover?.image_url,
        };
      });

      items.push(...variantItems);
    } else {
      const itemPrice = item.product.priceAfterDiscount || item.product.price;

      const itemDiscount = cart.coupon
        ? (cart.coupon.discount / 100) * itemPrice
        : 0;

      items.push({
        name: item.product.name,
        amount: Math.round((itemPrice - itemDiscount) * 100).toFixed(2),
        quantity: item.quantity,
        image: item.product.productCover?.image_url,
      });
    }
  });

  items.push({
    name: "Tax",
    description: "Tax cost",
    amount: (orderData.taxPrice * 100).toFixed(2),
    quantity: 1,
  });

  items.push({
    name: "Shipping",
    description: "Shipping cost",
    amount: (orderData.shippingPrice * 100).toFixed(2),
    quantity: 1,
  });

  return items;
};

const createPaymentIntentionService = async (order, cart) => {
  const { data } = await axios.post(
    "https://accept.paymob.com/v1/intention/",
    {
      amount: Math.round(order.finalPrice * 100),

      currency: "EGP",

      payment_methods: [5933466],

      billing_data: order.shippingAddress,

      items: buildPaymobItems(order, cart).reverse(),

      special_reference: order._id.toString(),

      extras: {
        userId: order.user._id,
      },

      expiration: 15 * 60,

      notification_url: `${process.env.BASE_URL}/api/v1/payments/callback`,
    },
    {
      headers: {
        Authorization: `Token ${process.env.PAYMOB_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return data;
};

const handleTransactionProcessedCallbackService = async (
  callbackData,
  receivedHmac,
  isTransactionInquiry = false,
) => {
  if (!isTransactionInquiry) {
    const isVerified = verifyPaymobHmac(callbackData, receivedHmac);

    if (!isVerified) {
      throw new ApiError(
        400,
        "Invalid HMAC signature. Callback verification failed.",
      );
    }
  }

  const {
    id: transactionId,
    success,
    pending,
    amount_cents,
    integration_id,
    order: { id: paymobOrderId, merchant_order_id: orderId },
    source_data: { type: payment_method },
    payment_key_claims: {
      extra: { userId },
    },
  } = callbackData.obj;

  if (await PaymentModel.exists({ transactionId })) {
    throw new ApiError(
      400,
      `Payment with transaction ID ${transactionId} has already been processed.`,
    );
  }

  const session = await PaymentModel.startSession();

  try {
    await session.withTransaction(async () => {
      const date = new Date();

      if (success && !pending) {
        await updatePaymentService(
          paymobOrderId,
          amount_cents,
          {
            status: "paid",
            transactionId: transactionId,
            paymentMethod: payment_method,
            paymantIntegrationId: integration_id,
            webhookReceivedAt: date,
            paidAt: date,
            lastInquiryAt: null,
            nextInquiryAt: null,
            pendingExpiresAt: null,
          },
          session,
        );

        await updateOrderService(
          orderId,
          {
            paymentMethod: payment_method,
            paymentStatus: "paid",
            orderStatus: "processing",
            payment: {
              transactionId,
              provider: "paymob",
            },
            paidAt: date,
          },
          session,
        );

        const cart = await CartModel.findOne({ user: userId }).session(session);

        const cartItems = await CartItemModel.find({ cart: cart._id }).session(
          session,
        );

        await decreaseOrderStockService(cartItems, session);

        await clearCartService(userId, session);
      } else if (!success && !pending) {
        await updatePaymentService(
          paymobOrderId,
          amount_cents,
          {
            status: "failed",
            transactionId: transactionId,
            paymentMethod: payment_method,
            paymantIntegrationId: integration_id,
            webhookReceivedAt: date,
            failedAt: date,
            paidAt: null,
            lastInquiryAt: null,
            nextInquiryAt: null,
            pendingExpiresAt: null,
          },
          session,
        );

        await updateOrderService(
          orderId,
          {
            paymentMethod: payment_method,
            paymentStatus: "failed",
            orderStatus: "cancelled",
            payment: {
              transactionId,
              provider: "paymob",
            },
            paidAt: null,
          },
          session,
        );
      }
    });
  } finally {
    await session.endSession();
  }
};

const verifyPaymobHmac = (data, receivedHmac) => {
  const {
    amount_cents,
    created_at,
    currency,
    error_occured,
    has_parent_transaction,
    id,
    integration_id,
    is_3d_secure,
    is_auth,
    is_capture,
    is_refunded,
    is_standalone_payment,
    is_voided,
    order,
    owner,
    pending,
    source_data,
    success,
  } = data.obj;

  const concatenatedString =
    amount_cents +
    created_at +
    currency +
    error_occured +
    has_parent_transaction +
    id +
    integration_id +
    is_3d_secure +
    is_auth +
    is_capture +
    is_refunded +
    is_standalone_payment +
    is_voided +
    order.id +
    owner +
    pending +
    source_data.pan +
    source_data.sub_type +
    source_data.type +
    success;

  const calculatedHmac = crypto
    .createHmac("sha512", process.env.PAYMOB_HMAC_SECRET)
    .update(concatenatedString)
    .digest("hex");

  const calculatedBuffer = Buffer.from(calculatedHmac, "hex");

  const receivedBuffer = Buffer.from(receivedHmac, "hex");

  if (calculatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedBuffer, receivedBuffer);
};

const updatePaymentService = async (
  paymobOrderId,
  amount_cents,
  paymentData,
  session = null,
) => {
  const payment = await PaymentModel.findOne({
    paymobOrderId,
    amount: amount_cents,
  });

  if (!payment) {
    throw new ApiError(
      404,
      `Payment not found for Paymob Order ID: ${paymobOrderId}`,
    );
  }

  Object.assign(payment, paymentData);

  await payment.save(session ? { session } : undefined);
};

// Reconcile pending payments every 2 minutes
cron.schedule(process.env.RECONCILIATION_CRON_INTERVAL, async () => {
  await reconcilePendingPayments();
});

const reconcilePendingPayments = async () => {
  const payments = await PaymentModel.find({
    provider: "paymob",
    status: "pending",
    transactionId: null,
    nextInquiryAt: { $lte: new Date() },
  });

  for (const payment of payments) {
    await inquirePaymobOrder(payment.paymobOrderId);
  }
};

const inquirePaymobOrder = async (paymobOrderId) => {
  const authToken = await getPaymobAuthToken();

  try {
    const { data } = await axios.post(
      "https://accept.paymob.com/api/ecommerce/orders/transaction_inquiry",
      {
        auth_token: authToken,
        order_id: paymobOrderId,
      },
    );

    await handleTransactionProcessedCallbackService({ obj: data }, null, true);
  } catch (error) {
    const date = new Date();
    await PaymentModel.findOneAndUpdate(
      { paymobOrderId },
      {
        $inc: { reconciliationAttempts: 1 },
        lastInquiryAt: date,
        nextInquiryAt: new Date(
          date.getTime() +
            parseInt(process.env.PAYMENT_NEXT_INQUIRY_INTERVAL) * 60 * 1000,
        ),
      },
    );
  }
};

const getPaymobAuthToken = async () => {
  const { data } = await axios.post(
    "https://accept.paymob.com/api/auth/tokens",
    {
      api_key: process.env.PAYMOB_API_KEY,
    },
  );

  return data.token;
};

module.exports = {
  createPaymentService,
  createPaymentIntentionService,
  handleTransactionProcessedCallbackService,
};
