const ProductModel = require("../models/product.model");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");

const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("./cloudinary.service");

const createProductService = async (productData, files) => {
  const existingProduct = await ProductModel.findOne({
    name: productData.name,
  });

  if (existingProduct) {
    throw new ApiError(
      400,
      "Product already exists. Please choose a different name.",
    );
  }

  ["slug", "sold", "ratingsAverage", "ratingsQuantity"].forEach((field) => {
    if (field in productData) {
      delete productData[field];
    }
  });

  if (!productData.priceAfterDiscount) {
    productData.priceAfterDiscount = productData.price;
  }

  const product = new ProductModel(productData);

  await uploadProductImages(product, files);

  await product.save();

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  return product;
};

const getProductsService = async (query) => {
  const apiFeatures = new ApiFeatures(ProductModel.find(), query);

  apiFeatures
    .filter()
    .search("name", "description", "tags")
    .paginate(await ProductModel.countDocuments(apiFeatures.filters))
    .sort()
    .limitFields()
    .populate(["category", "brand", "subcategories"], "name");

  const { totalResults, totalPages } = apiFeatures.paginatedResults;

  // Check if the requested page number is valid
  if (apiFeatures.page > totalPages && totalResults > 0) {
    throw new ApiError(
      400,
      "Invalid page number. The requested page exceeds the total number of pages.",
    );
  }

  const products = await apiFeatures.query;

  return { products, paginatedResults: apiFeatures.paginatedResults };
};

const getProductByIdService = async (id) => {
  const product = await ProductModel.findById(id);

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  return product;
};

const updateProductService = async (id, updatedData, files) => {
  const product = await ProductModel.findById(id);

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  if (updatedData.name) {
    const existingProduct = await ProductModel.findOne({
      name: updatedData.name,
      _id: { $ne: id },
    });

    if (existingProduct) {
      throw new ApiError(
        400,
        "Product name already exists. Please choose a different name.",
      );
    }
  }

  // Collect Public IDs of Variants Images which there belong to variants exist in the product but not exist in the updatedData
  const updatedVariantIds =
    updatedData.variants
      ?.map((variant) => variant._id?.toString())
      .filter(Boolean) || [];

  const oldVariantsImagesIds = product.variants
    .filter((variant) => !updatedVariantIds.includes(variant._id?.toString()))
    .map((variant) => variant.image?.public_id)
    .filter(Boolean);

  // Update variants separately
  if (updatedData.variants) {
    updateProductVariants(product, updatedData.variants);

    delete updatedData.variants;
  }

  // Update other product fields
  Object.assign(product, updatedData);

  await updateProductImages(product, files, updatedData.deletedImages);

  // Delete old variant images from Cloudinary if they are not present in the updatedData
  await Promise.all(
    oldVariantsImagesIds.map((publicId) => deleteFromCloudinary(publicId)),
  );

  await product.save();

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  return product;
};

const updateProductVariants = (product, updatedVariants) => {
  const oldVariantsMap = new Map(
    product.variants.map((variant) => [variant._id.toString(), variant]),
  );

  product.variants = updatedVariants.map((updatedVariant) => {
    // Existing variant
    if (updatedVariant._id) {
      const oldVariant = oldVariantsMap.get(updatedVariant._id.toString());

      if (!oldVariant) {
        throw new ApiError(
          400,
          `Variant with ID ${updatedVariant._id} not found in the product. Please provide a valid variant ID.`,
        );
      }

      oldVariant.color = updatedVariant.color;
      oldVariant.size = updatedVariant.size;
      oldVariant.quantity = updatedVariant.quantity;
      oldVariant.price = updatedVariant.price;
      oldVariant.priceAfterDiscount = updatedVariant.priceAfterDiscount;

      return oldVariant;
    }

    // New variant
    return updatedVariant;
  });
};

const validateUpdateProductImages = (product, files, deletedImages) => {
  let updatedCount = 0;
  let newCount = 0;
  let notUpdatedCount = 0;

  product.productImages.forEach((image) => {
    if (image?.public_id && deletedImages.includes(image.public_id)) {
      updatedCount++;
    } else {
      notUpdatedCount++;
    }
  });

  newCount = files.productImages?.length - updatedCount;

  if (files.productImages?.length < updatedCount) {
    throw new ApiError(
      400,
      `The number of uploaded product images is less than the number of images that need to be updated. Please ensure that you upload the correct number of images.`,
    );
  }

  if (newCount + updatedCount + notUpdatedCount > 5) {
    throw new ApiError(
      400,
      `You can only upload up to 5 product images for each product. Please remove some images before uploading new ones.`,
    );
  }
};

const validateUpdateVariantsImages = (product, files, deletedImages) => {
  let updatedCount = 0;
  let newCount = 0;
  let notUpdatedCount = 0;
  product.variants.forEach((variant) => {
    if (
      variant.image?.public_id &&
      deletedImages.includes(variant.image.public_id)
    ) {
      updatedCount++;
    } else if (!variant.image) {
      newCount++;
    } else {
      notUpdatedCount++;
    }
  });

  if (files.variantsImages?.length !== updatedCount + newCount) {
    throw new ApiError(
      400,
      `The number of uploaded variant images (${files.variantsImages?.length}) does not match the number of images that need to be updated (${updatedCount}) or added (${newCount}). Please ensure that you upload the correct number of images.`,
    );
  }
};

const deleteProductService = async (id, session = null) => {
  const productQuery = ProductModel.findByIdAndDelete(id);

  if (session) {
    productQuery.session(session);
  }

  const product = await productQuery;

  if (!product) {
    throw new ApiError(
      404,
      "Product not found. Please provide a valid product ID.",
    );
  }

  await deleteProductImages(product);

  await product.populate([
    { path: "category", select: "name" },
    { path: "brand", select: "name" },
    { path: "subcategories", select: "name" },
  ]);

  return product;
};

const uploadProductImages = async (product, files) => {
  if (!files) {
    throw new ApiError(
      400,
      "No images were uploaded. Please upload at least one product cover image and one product image.",
    );
  }

  if (files.productCover && files.productCover.length > 0) {
    const productCoverFile = files.productCover[0];
    const productCoverUploadResult = await uploadToCloudinary(
      productCoverFile.buffer,
      "products/covers",
    );

    product.productCover = {
      image_url: productCoverUploadResult.secure_url,
      public_id: productCoverUploadResult.public_id,
    };
  }

  if (files.productImages && files.productImages.length > 0) {
    const productImagesUploadResults = await Promise.all(
      files.productImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/images"),
      ),
    );

    product.productImages = productImagesUploadResults.map((result) => {
      return {
        image_url: result.secure_url,
        public_id: result.public_id,
      };
    });
  }

  if (files.variantsImages && files.variantsImages.length > 0) {
    if (files.variantsImages.length !== product.variants.length) {
      throw new ApiError(
        400,
        `The number of uploaded variant images (${files.variantsImages.length}) does not match the number of variants (${product.variants.length}). Please ensure that you upload the correct number of images.`,
      );
    }
    const variantsUploadResults = await Promise.all(
      files.variantsImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/variants"),
      ),
    );

    product.variants = variantsUploadResults.map((result, index) => {
      const variantData = product.variants[index] || {};
      return {
        ...variantData,
        image: {
          image_url: result.secure_url,
          public_id: result.public_id,
        },
      };
    });
  }

  return product;
};

const deleteProductImages = async (product) => {
  const publicIds = [];

  if (product.productCover?.public_id) {
    publicIds.push(product.productCover.public_id);
  }

  if (product.productImages?.length > 0) {
    publicIds.push(...product.productImages.map((image) => image.public_id));
  }

  if (product.variants?.length > 0) {
    publicIds.push(
      ...product.variants
        .filter((variant) => variant.image?.public_id)
        .map((variant) => variant.image.public_id),
    );
  }

  await Promise.all(
    publicIds.map((publicId) => deleteFromCloudinary(publicId)),
  );
};

const updateProductImages = async (product, files, deletedImages = []) => {
  const deletedImagesIds = [];

  if (files.productCover?.length > 0) {
    const productCoverUploadResult = await uploadToCloudinary(
      files.productCover[0].buffer,
      "products/covers",
    );

    if (product.productCover?.public_id) {
      deletedImagesIds.push(product.productCover.public_id);
    }

    product.productCover = {
      image_url: productCoverUploadResult.secure_url,
      public_id: productCoverUploadResult.public_id,
    };
  }

  if (files.productImages?.length > 0) {
    // Validate that the number of uploaded product images matches the number of images that need to be updated or added
    validateUpdateProductImages(product, files, deletedImages);

    // Upload new product images to Cloudinary
    const productImagesUploadResults = await Promise.all(
      files.productImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/images"),
      ),
    );

    let uploadIndex = 0;

    // Update the product images with the new images
    product.productImages.forEach((image, index) => {
      const shouldUpdateImage =
        image?.public_id && deletedImages.includes(image.public_id);

      if (!shouldUpdateImage) {
        return;
      }

      const uploadedImage = productImagesUploadResults[uploadIndex++];

      deletedImagesIds.push(image.public_id);

      product.productImages[index] = {
        image_url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    });

    if (uploadIndex < productImagesUploadResults.length) {
      // Add any remaining new images to the productImages array
      const remainingImages = productImagesUploadResults.slice(uploadIndex);
      product.productImages.push(
        ...remainingImages.map((result) => ({
          image_url: result.secure_url,
          public_id: result.public_id,
        })),
      );
    }
  }

  if (files.variantsImages?.length > 0) {
    // Validate that the number of uploaded variant images matches the number of variants that need to be updated or added
    validateUpdateVariantsImages(product, files, deletedImages);

    // Upload new variant images to Cloudinary
    const variantsUploadResults = await Promise.all(
      files.variantsImages.map((file) =>
        uploadToCloudinary(file.buffer, "products/variants"),
      ),
    );

    let uploadIndex = 0;

    // Update the product variants with the new images
    product.variants.forEach((variant) => {
      const shouldUpdateImage =
        (variant.image?.public_id &&
          deletedImages.includes(variant.image.public_id)) ||
        !variant.image;

      if (!shouldUpdateImage) {
        return;
      }

      const uploadedImage = variantsUploadResults[uploadIndex++];

      if (variant.image?.public_id)
        deletedImagesIds.push(variant.image?.public_id);

      variant.image = {
        image_url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    });
  } else {
    if (
      !product.variants.every((variant) => variant.image) &&
      product.variants.some((variant) => variant.image)
    ) {
      throw new ApiError(
        400,
        "You must upload images for all variants when there are variants with images. Please ensure that you upload the correct number of variant images.",
      );
    }
  }

  if (deletedImagesIds.length > 0) {
    await Promise.all(
      deletedImagesIds.map((publicId) => deleteFromCloudinary(publicId)),
    );
  }

  return product;
};

module.exports = {
  createProductService,
  getProductsService,
  getProductByIdService,
  updateProductService,
  deleteProductService,
  deleteProductImages,
};
