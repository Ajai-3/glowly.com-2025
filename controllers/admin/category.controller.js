import cron from "node-cron";
import User from "../../models/user.model.js";
import Offer from "../../models/offer.model.js";
import Product from "../../models/product.model.js";
import Category from "../../models/category.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import { VIEWS, ROUTES, ABSOLUTE } from "../../constants/routes.js";
import { CATEGORY_MESSAGES } from "../../constants/categoryMessages.js";
import Subcategory from "../../models/subcategory.model.js";

// ========================================================================================
// RENDER CATEGORY AND SUBCATEGORY MANAGEMENT PAGE
// ========================================================================================
// This function renders the "Category and Subcategory Management" page for admins,
// allowing them to view, manage, and organize product categories and their corresponding
// subcategories. Admins can add, edit, or remove categories and subcategories to ensure
// products are properly categorized and organized on the platform.
// ========================================================================================
export const renderCategoryPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });

    const CategoryData = await Category.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("subcategories")
      .populate({
        path: "offerId",
        match: { isDeleted: false },
      });

    const totalCategories = await Category.countDocuments();

    const totalPages = Math.ceil(totalCategories / limit);

    return res.render(VIEWS.ADMIN.CATEGORY, {
      category: CategoryData,
      currentPage: page,
      totalPages: totalPages,
      totalCategories: totalCategories,
      queryParams: req.query,
      admin,
    });
  } catch (error) {
    console.error("Error in fetching Category page:", error);
  }
};

// ========================================================================================
// RENDER TOP CATEGORIES
// ========================================================================================
// This function renders the "Top Categories" page for admins, displaying categories
// sorted by total sales. Admins can track the best-performing categories.
// ========================================================================================

export const topCategories = async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          totalSold: { $sum: "$soldCount" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);
    res.json(categories);
  } catch (error) {
    console.error("Error fetching top categories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(CART_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};
// ========================================================================================
// RENDER TOP SUBCATEGORIES BASED ON SALES
// ========================================================================================
// This function renders the "Top Subcategories" page for admins, displaying subcategories
// sorted by total sales. Admins can track the best-performing subcategories.
// ========================================================================================

export const topSubCategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.aggregate([
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          totalSold: { $sum: "$soldCount" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);
    res.json(subcategories);
  } catch (error) {
    console.error("Error fetching top subcategories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(CART_MESSAGES.INTERNAL_SERVER_ERROR);
  }
};

// ========================================================================================
// RENDER ADD CATEGORY PAGE
// ========================================================================================
// This function renders the "Add Category" page for admins to create new categories
// and subcategories for organizing products.
// ========================================================================================
export const renderAddCategoryPage = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });
    const categories = await Category.find();
    res.render(VIEWS.ADMIN.ADD_CATEGORY, { categories, admin });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error fetching categories");
  }
};

// ========================================================================================
// ADD CATEGORY
// ========================================================================================
// This function allows admins to add a new category (and optionally subcategories) to
// the system, organizing products under the specified category.
// ========================================================================================

export const addCategory = async (req, res) => {
  try {
    const {
      categoryName,
      description,
      subcategoryName,
      subcategoryDescription,
    } = req.body;

    if (
      !categoryName ||
      !description ||
      !subcategoryName ||
      !subcategoryDescription
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send(CATEGORY_MESSAGES.FIELDS_REQUIRED);
    }

    const existingCategory = await Category.findOne({
      name: { $regex: `^${categoryName}$`, $options: "i" },
    });

    if (existingCategory) {
      return res.status(StatusCodes.BAD_REQUEST).send(CATEGORY_MESSAGES.CATEGORY_EXISTS);
    }

    const newCategory = new Category({
      name: categoryName,
      description: description,
      soldCount: 0,
      subcategories: [],
    });

    const newSubcategory = new Subcategory({
      name: subcategoryName,
      description: subcategoryDescription,
      categoryId: newCategory._id,
      soldCount: 0,
    });

    newCategory.subcategories.push(newSubcategory._id);

    await Promise.all([newSubcategory.save(), newCategory.save()]);

    res.redirect(ABSOLUTE.ADMIN.CATEGORY);
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(CATEGORY_MESSAGES.ADD_ERROR);
  }
};

// ========================================================================================
// ADD SUBCATEGORY TO EXISTING CATEGORY
// ========================================================================================
// This function allows admins to add a new subcategory under an existing category,
// helping to organize products more specifically within the category.
// ========================================================================================
export const addSubcategoryToExistingCategory = async (req, res) => {
  try {
    const { categoryId, subcategoryName, subcategoryDescription } = req.body;

    if (!categoryId || !subcategoryName || !subcategoryDescription) {
      return res.status(StatusCodes.BAD_REQUEST).send(CATEGORY_MESSAGES.SUBCAT_FIELDS_REQUIRED);
    }

    const category = await Category.findById(categoryId).populate(
      "subcategories"
    );
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).send(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
    }

    const duplicateSubcategory = category.subcategories.find(
      (subcategory) =>
        subcategory.name.toLowerCase() === subcategoryName.toLowerCase()
    );

    if (duplicateSubcategory) {
      return res.status(StatusCodes.BAD_REQUEST).send(CATEGORY_MESSAGES.SUBCATEGORY_EXISTS);
    }

    const newSubcategory = new Subcategory({
      name: subcategoryName,
      description: subcategoryDescription,
      categoryId: category._id,
    });

    category.subcategories.push(newSubcategory._id);

    await Promise.all([newSubcategory.save(), category.save()]);

    res.redirect(ROUTES.ADMIN.CATEGORY);
  } catch (error) {
    console.error("Error adding subcategory:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(CATEGORY_MESSAGES.ADD_SUBCAT_ERROR);
  }
};

// ========================================================================================
// RENDER EDIT CATEGORY PAGE
// ========================================================================================
// This function renders the "Edit Category" page for admins, allowing them to modify
// the details of an existing category, such as name, description, and other attributes.
// ========================================================================================
export const renderEditCategoryPage = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });

    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).send(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
    }

    res.render(VIEWS.ADMIN.EDIT_CATEGORY, { category, admin });
  } catch (error) {
    console.error("Error fetching category for editing:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("Error fetching category for editing");
  }
};
// ========================================================================================
// UPDATE CATEGORY
// ========================================================================================
// This function allows admins to update the details of an existing category, including
// its name, description, and other attributes, ensuring the category information is current.
// ========================================================================================
export const updateCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, description } = req.body;

    const existingCategory = await Category.findOne({
      name,
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: CATEGORY_MESSAGES.CATEGORY_EXISTS_ERROR,
        type: "error",
      });
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { name, description },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: CATEGORY_MESSAGES.CATEGORY_NOT_FOUND,
        type: "error",
      });
    }

    res.json({
      msg: CATEGORY_MESSAGES.CATEGORY_UPDATED,
      type: "success",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      msg: CATEGORY_MESSAGES.CATEGORY_UPDATE_ERROR,
      type: "error",
    });
  }
};

// ========================================================================================
// LIST/UNLIST CATEGORY (SOFT DELETE/RESTORE)
// ========================================================================================
// This function allows admins to soft delete (unlist) or restore (list) a category,
// enabling them to manage the visibility of categories without permanently removing them.
// ========================================================================================
export const toggleCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: CATEGORY_MESSAGES.CATEGORY_NOT_FOUND });
    }

    category.isListed = req.body.isListed;

    if (!category.isListed) {
      category.deleted_at = Date.now();
    } else {
      category.deleted_at = null;
    }

    await category.save();
    return res.json({ message: CATEGORY_MESSAGES.STATUS_UPDATED });
  } catch (error) {
    console.error("Error toggling category: ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: CATEGORY_MESSAGES.SERVER_ERROR });
  }
};

// ========================================================================================
// LIST/UNLIST SUBCATEGORY (SOFT DELETE/RESTORE)
// ========================================================================================
// This function allows admins to soft delete (unlist) or restore (relist) a subcategory,
// managing the visibility of subcategories without permanently removing them.
// ========================================================================================
export const toggleSubcategory = async (req, res) => {
  try {
    const subcategoryId = req.params.id;
    const subcategory = await Subcategory.findById(subcategoryId);

    if (!subcategory) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: CATEGORY_MESSAGES.SUBCATEGORY_NOT_FOUND });
    }

    subcategory.isListed = req.body.isListed;
    await subcategory.save();

    return res.json({ message: CATEGORY_MESSAGES.SUBCAT_STATUS_UPDATED });
  } catch (error) {
    console.error("Error toggling subcategory: ", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: CATEGORY_MESSAGES.SERVER_ERROR });
  }
};

// ========================================================================================
// RENDER ADD OFFER FOR CATEGORY PAGE
// ========================================================================================
// This function renders the "Add Offer for Category" page, allowing admins to create
// special offers or discounts for specific product categories.
// ========================================================================================
export const renderAddOfferPage = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });

    const category = await Category.findById(categoryId).populate(
      "subcategories"
    );

    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).send(CATEGORY_MESSAGES.CATEGORY_NOT_FOUND);
    }

    return res.render(VIEWS.ADMIN.OFFER, {
      category: category,
      categoryId: categoryId,
      subCategories: category.subcategories,
      admin,
    });
  } catch (error) {
    console.error("Error in adding offer in category page", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(BRAND_MESSAGES.SERVER_ERROR);
  }
};

// ========================================================================================
// ADD OFFER FOR CATEGORY
// ========================================================================================
// This function allows admins to add special offers or discounts to a specific category,
// making it easier to promote products within that category through limited-time deals or discounts.
// ========================================================================================
export const addOffer = async (req, res) => {
  try {
    const {
      categoryId,
      offerType,
      offerValue,
      description,
      startDate,
      endDate,
    } = req.body;

    if (
      !categoryId ||
      !offerType ||
      !offerValue ||
      !description ||
      !startDate ||
      !endDate
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: CATEGORY_MESSAGES.OFFER_FIELDS_REQUIRED,
      });
    }

    const category = await Category.findOne({ _id: categoryId });
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Category not found.",
      });
    }

    const currentDate = new Date();

    const newOffer = new Offer({
      offerType,
      offerValue,
      name: description,
      startDate,
      endDate,
      isActive:
        new Date(startDate).toISOString().split("T")[0] ===
        currentDate.toISOString().split("T")[0],
      isDeleted: false,
    });

    category.offerId = newOffer._id;

    await Promise.all([newOffer.save(), category.save()]);

    const activeOffers = await Offer.find({
      isDeleted: false,
      startDate: { $lte: currentDate },
    });

    const eligibleProducts = await Product.find({
      isDeleted: false,
      $and: [
        { productOffer: "Not applied" },
        { categoryOffer: { $in: ["Not applied", null, ""] } },
      ],
    });


    for (const offer of activeOffers) {
      const category = await Category.findOne({ offerId: offer._id });
      if (!category) continue;

      const categoryProducts = eligibleProducts.filter(
        (product) =>
          product.categoryId.toString() === category._id.toString() &&
          product.productOffer !== "Applied"
      );

      for (const product of categoryProducts) {
        if (product.productOffer === "Applied") {
          continue;
        }

        for (const variant of product.variants) {
          if (!variant.salePriceBeforeOffer) {
            variant.salePriceBeforeOffer = variant.salePrice;
          }

          const maxDiscountPercentage = 70;
          const maxDiscountValue =
            (maxDiscountPercentage / 100) * variant.regularPrice;
          let newSalePrice = variant.regularPrice;

          if (offer.offerType === "flat") {
            const appliedDiscount = Math.min(
              offer.offerValue,
              maxDiscountValue
            );
            newSalePrice = Math.max(variant.regularPrice - appliedDiscount, 0);
          } else if (offer.offerType === "percentage") {
            const appliedDiscount = Math.min(
              variant.regularPrice * (offer.offerValue / 100),
              maxDiscountValue
            );
            newSalePrice = Math.max(variant.regularPrice - appliedDiscount, 0);
          }

          variant.salePrice = Math.round(newSalePrice);
        }

        product.categoryOffer = "Applied";
        product.productOffer = "Not applied";

        await product.save();
      }
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: CATEGORY_MESSAGES.OFFER_APPLIED,
    });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CATEGORY_MESSAGES.OFFER_ADD_ERROR,
    });
  }
};

// ========================================================================================
// REMOVE OFFER FROM CATEGORY
// ========================================================================================
// This function allows admins to remove an offer from a specific category,
// effectively deactivating the offer and ensuring it is no longer applied to the category.
// ========================================================================================
export const removeOffer = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { offerId } = req.body;

    if (!offerId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: CATEGORY_MESSAGES.OFFER_ID_REQUIRED,
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Category not found.",
      });
    }

    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: CATEGORY_MESSAGES.OFFER_NOT_FOUND,
      });
    }

    offer.isActive = false;
    offer.isDeleted = true;
    await offer.save();

    const maxDiscountPercentage = 70;
    const products = await Product.find({
      categoryId: category._id,
      isDeleted: false,
      productOffer: "Not applied",
    });

    for (const product of products) {
      for (const variant of product.variants) {
        variant.salePrice = variant.salePriceBeforeOffer;
      }

      product.categoryOffer = "Not applied";
      await product.save();
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: CATEGORY_MESSAGES.OFFER_REMOVED,
    });
  } catch (error) {
    console.error("Error removing offer:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: CATEGORY_MESSAGES.OFFER_REMOVE_ERROR,
    });
  }
};
