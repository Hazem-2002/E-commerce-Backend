const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    first_name: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    last_name: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    phone_number: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    district: {
      type: String,
      required: [true, "District is required"],
      trim: true,
    },

    street: {
      type: String,
      required: [true, "Street is required"],
      trim: true,
    },

    building: {
      type: String,
      trim: true,
    },

    apartment: {
      type: String,
      trim: true,
    },

    floor: {
      type: String,
      trim: true,
    },

    postal_code: {
      type: String,
      trim: true,
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

addressSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const AddressModel = mongoose.model("Address", addressSchema);

module.exports = AddressModel;
