class ApiFeatures {
  constructor(query, queryString) {
    const { page, limit, sort, fields, search, ...productsFilters } =
      queryString;

    this.query = query;
    this.page = page;
    this.limit = limit;
    this.sortBy = sort;
    this.fields = fields;
    this.searchQuery = search;
    this.productsFilters = productsFilters;
    this.filters = {};
  }

  filter(filter = {}) {
    this.filters = JSON.parse(
      JSON.stringify(this.productsFilters).replace(
        /\b(gt|gte|lt|lte)\b/g,
        (match) => `$${match}`,
      ),
    );

    if (filter && Object.keys(filter).length > 0) {
      this.filters = { ...this.filters, ...filter };
    }

    this.query = this.query.find(this.filters);

    return this;
  }

  search() {
    if (this.searchQuery) {
      this.filters.$or = [
        { name: { $regex: this.searchQuery.trim(), $options: "i" } },
        { description: { $regex: this.searchQuery.trim(), $options: "i" } },
      ];

      this.query = this.query.find(this.filters);
    }

    return this;
  }

  paginate(countDocuments) {
    const page = parseInt(this.page) || 1;
    const limit = parseInt(this.limit) || 10;
    const skip = (page - 1) * limit;

    this.paginatedResults = {
      currentPage: page,
      totalPages: Math.ceil(countDocuments / limit),
      totalResults: countDocuments,
      nextPage: skip + limit < countDocuments ? page + 1 : 0,
      prevPage: skip > 0 ? page - 1 : 0,
    };

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  sort() {
    const sortBy = this.sortBy ? this.sortBy.replace(/,/g, " ") : "-createdAt";

    this.query = this.query.sort(sortBy);

    return this;
  }

  limitFields(excludeFields = "") {
    const queryFields = this.fields ? this.fields.replace(/,/g, " ") : "";

    const selectedFields = queryFields ? queryFields : excludeFields;

    this.query = this.query.select(selectedFields);

    return this;
  }

  populate(fieldsToPopulate = [], excludeFields = "") {
    const fields = this.fields
      ? this.fields.split(",").map((f) => f.toLowerCase().trim())
      : [];

    const fieldSelectionType =
      fields.length > 0
        ? fields[0].startsWith("-")
          ? "exclusion"
          : "inclusion"
        : "none";

    if (fields.length > 0 && fieldSelectionType === "inclusion") {
      for (const field of fields) {
        if (fieldsToPopulate.includes(field)) {
          this.query.populate({
            path: fieldSelectionType === "inclusion" ? field : field.slice(1),
            select: excludeFields ? excludeFields : "name",
          });
        }
      }
    } else {
      for (const field of fieldsToPopulate) {
        if (fields.length === 0 || !fields.includes(`-${field}`)) {
          this.query.populate({
            path: field,
            select: excludeFields ? excludeFields : "name",
          });
        }
      }
    }

    return this;
  }
}

module.exports = ApiFeatures;
