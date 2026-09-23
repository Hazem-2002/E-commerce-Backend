const AddressModel = require("../models/address.model");
const UserModel = require("../models/users.model");

const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const getAddressesService = async (query, userId) => {
  const existingUser = await UserModel.exists({ _id: userId });
  if (!existingUser) {
    throw new ApiError(404, "User not found. Please check the provided ID.");
  }

  const apiFeatures = new ApiFeatures(
    AddressModel.find({ user: userId }),
    query,
  );

  apiFeatures
    .filter()
    .paginate(await AddressModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate([{ path: "user", select: "name email role" }]);

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const addresses = await apiFeatures.query;

  return {
    addresses,
    paginatedResults: apiFeatures.paginatedResults,
  };
};

const addNewAddressService = async (addressData) => {
  if (addressData.user) {
    const existingUser = await UserModel.exists({ _id: addressData.user });
    if (!existingUser) {
      throw new ApiError(404, "User not found. Please check the provided ID.");
    }
  } else {
    throw new ApiError(400, "User ID is required to add a new address.");
  }

  //   Check for duplicate title for the same user
  if (
    await AddressModel.exists({
      title: addressData.title,
      user: addressData.user,
    })
  ) {
    throw new ApiError(
      400,
      "An address with this title already exists for this user.",
    );
  }

  const address = await AddressModel.create(addressData);
  return address;
};

const updateAddressService = async (addressId, addressData) => {
  const address = await AddressModel.findById(addressId);
  if (!address) {
    throw new ApiError(404, "Address not found. Please check the provided ID.");
  }

  //   Check for duplicate title for the same user
  if (
    await AddressModel.exists({
      title: addressData.title,
      _id: { $ne: addressId },
      user: address.user,
    })
  ) {
    throw new ApiError(
      400,
      "An address with this title already exists for the this user.",
    );
  }

  Object.assign(address, addressData);
  await address.save();
  return address;
};

const deleteAddressService = async (addressId) => {
  const address = await AddressModel.findByIdAndDelete(addressId);
  if (!address) {
    throw new ApiError(404, "Address not found. Please check the provided ID.");
  }

  return address;
};

module.exports = {
  getAddressesService,
  addNewAddressService,
  updateAddressService,
  deleteAddressService,
};
