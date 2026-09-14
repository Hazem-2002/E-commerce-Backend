const asyncWrapper = require("../utils/asyncWrapper");
const httpStatusText = require("../utils/httpStatusText");
const ApiError = require("../utils/apiError");

const {
  getAddressesService,
  addNewAddressService,
  updateAddressService,
  deleteAddressService,
} = require("../services/address.service");

const getAddresses = asyncWrapper(async (req, res, next) => {
  const { addresses, paginatedResults } = await getAddressesService(
    req.query,
    req.user._id,
  );

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    ...paginatedResults,
    data: { addresses },
  });
});

const addNewAddress = asyncWrapper(async (req, res, next) => {
  const addressData = req.body;
  addressData.user = req.user._id;

  const newAddress = await addNewAddressService(addressData);

  res.status(201).json({
    status: httpStatusText.SUCCESS,
    message: "Address added successfully.",
    data: { address: newAddress },
  });
});

const updateAddress = asyncWrapper(async (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(
      new ApiError(
        400,
        "No data provided for update. Please provide at least one field to update.",
      ),
    );
  }

  const address = await updateAddressService(req.params.addressId, req.body);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Address updated successfully.",
    data: { address },
  });
});

const deleteAddress = asyncWrapper(async (req, res, next) => {
  const address = await deleteAddressService(req.params.addressId);

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Address deleted successfully.",
    data: { address },
  });
});

module.exports = {
  getAddresses,
  addNewAddress,
  updateAddress,
  deleteAddress,
};
