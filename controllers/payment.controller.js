const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");

const {
  prepareOrderService,
  createOrderService,
} = require("../services/order.service");

const {
  createPaymentIntentionService,
  createPaymentService,
  handleTransactionProcessedCallbackService,
} = require("../services/payment.service");

const createPaymentIntention = asyncWrapper(async (req, res) => {
  const { orderData, cart } = await prepareOrderService({
    userId: req.user._id,
    addressId: req.body?.addressId,
    shippingAddress: req.body?.shippingAddress,
  });

  orderData.paymentMethod = "online_payment";

  const order = await createOrderService(orderData);

  const intentionData = await createPaymentIntentionService(order, cart);

  await createPaymentService(intentionData);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Payment intention created successfully",
    data: { client_secret: intentionData.client_secret },
  });
});

const handleTransactionProcessedCallback = asyncWrapper(async (req, res) => {
  await handleTransactionProcessedCallbackService(req.body, req.query.hmac);
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Transaction processed callback handled successfully",
  });
});

module.exports = {
  createPaymentIntention,
  handleTransactionProcessedCallback,
};
