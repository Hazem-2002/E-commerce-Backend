const mongoose = require("mongoose");
const slugify = require("slugify");
const bcrypt = require("bcrypt");

const ApiError = require("../utils/apiError");

const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      minlength: [3, "User name must be at least 3 characters long"],
      maxlength: [50, "User name must be at most 50 characters long"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "User slug is required"],
      unique: [true, "Slug already exists"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "User phone is required"],
      unique: [true, "Phone number already exists"],
      trim: true,
      match: [
        /^(\+?\d{1,3}[- ]?)?\d{10}$/,
        "Please enter a valid phone number",
      ],
    },
    email: {
      type: String,
      required: [true, "User email is required"],
      unique: [true, "Email already exists"],
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "User password is required"],
      minlength: [6, "User password must be at least 6 characters long"],
      select: false,
    },

    passwordChangedAt: {
      type: Date,
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "admin", "super-admin"],
      default: "user",
    },

    image: {
      type: {
        image_url: String,
        public_id: String,
      },
      default: {
        image_url:
          "https://res.cloudinary.com/tbt51mng/image/upload/v1788654904/users/profile-images/uvjrevfifa7lvkpn3o3k.png",
        public_id: "users/profile-images/uvjrevfifa7lvkpn3o3k",
      },
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password;
        delete ret.__v;

        delete ret.image?.id;
        delete ret.image?._id;
        delete ret.id;

        return ret;
      },
    },
  },
);

// Pre-save middleware to hash password if modified
usersSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Pre-save middleware to generate slug from name
usersSchema.pre("validate", function () {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true });
  }
});

// Pre-update middleware to generate slug from name when updating
usersSchema.pre(/update/i, function () {
  const update = this.getUpdate().$set || this.getUpdate();
  if (update && Object.keys(update).length) {
    if (update.name) {
      update.slug = slugify(update.name, { lower: true });
    }

    if (update.password) {
      update.password = bcrypt.hashSync(update.password, 10);
    }
  }
});

// Static method to validate user credentials
usersSchema.statics.credentials = async function (email, password) {
  const user = await this.findOne({ email }).select("+password");

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(400, "Invalid email or password");
  }

  return user;
};

const UsersModel = mongoose.model("User", usersSchema);

module.exports = UsersModel;
