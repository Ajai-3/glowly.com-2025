import express from "express";
import { ROUTES } from "../constants/routes.js";
const router = express.Router();
import { uploadImages, uploadBrandImage, uploadProfileImage } from "../helpers/cloudinary.js";
import {
  renderLoginPage,
  handleAdminLogin,
  handleAdminLogout,
} from "../controllers/admin/admin.controller.js";
import {
  redirectIfLoggedIn,
  verifyAdminToken,
  pageMiddlware,
} from "../middlewares/admin.midleware.js";
import {
  renderUsersPage,
  blockUser,
  unBlockUser,
} from "../controllers/admin/customer.controller.js";
import {
  renderCategoryPage,
  renderAddCategoryPage,
  addSubcategoryToExistingCategory,
  updateCategory,
  renderEditCategoryPage,
  toggleCategory,
  addCategory,
  toggleSubcategory,
  renderAddOfferPage,
  addOffer,
  removeOffer,
  topCategories,
  topSubCategories,
} from "../controllers/admin/category.controller.js";
import {
  renderProductsPage,
  renderAddProductsPage,
  addProduct,
  renderEditProductPage,
  editProduct,
  toggleProduct,
  topProducts,
  toggleProductVariant,
  addVariantPage,
  addNewVariants,
  addProductOffer,
  removeProductOffer,
} from "../controllers/admin/product.controller.js";
import {
  renderBrandPage,
  renderAddBrandPage,
  addBrand,
  renderEditBrandPage,
  editBrand,
  toggleBrand,
  topBrands,
} from "../controllers/admin/brand.controller.js";
import {
  renderCouponsPage,
  addCoupon,
  removeCoupon,
  restoreCoupon,
} from "../controllers/admin/coupon.controller.js";
import {
  renderOrderPage,
  updateOrderStatus,
} from "../controllers/admin/order.controller.js";
import {
  renderDashboardPage,
  salesData,
} from "../controllers/admin/dashboard.controller.js";
import { renderTopItemsPage } from "../controllers/admin/topitem.controller.js";
import {
  renderSettingsPage,
  updateAdminProfile,
} from "../controllers/admin/admin-settings.controller.js";

// Admin login and logout routes
router.get(ROUTES.ADMIN.LOGIN, redirectIfLoggedIn, renderLoginPage);
router.post(ROUTES.ADMIN.LOGIN, redirectIfLoggedIn, handleAdminLogin);
router.get(ROUTES.ADMIN.LOGOUT, handleAdminLogout);

// router.use(verifyAdminToken);
router.use(pageMiddlware);

// Dashboard Controller
router.get(ROUTES.ADMIN.DASHBOARD, verifyAdminToken, renderDashboardPage);
router.get(ROUTES.ADMIN.SALES_DATA, verifyAdminToken, salesData);

// Top items
router.get(ROUTES.ADMIN.TOP_ITEMS, verifyAdminToken, renderTopItemsPage);

// Product Routes
router.get(ROUTES.ADMIN.PRODUCTS, verifyAdminToken, renderProductsPage);
router.post(ROUTES.ADMIN.PRODUCT_OFFER, verifyAdminToken, addProductOffer);
router.post(ROUTES.ADMIN.REMOVE_PRODUCT_OFFER, verifyAdminToken, removeProductOffer);
router.get(ROUTES.ADMIN.SEARCH_PRODUCTS, verifyAdminToken, renderProductsPage);
router.get(ROUTES.ADMIN.ADD_PRODUCTS, verifyAdminToken, renderAddProductsPage);
router.patch(ROUTES.ADMIN.TOGGLE_PRODUCT, verifyAdminToken, toggleProduct); 
router.patch(ROUTES.ADMIN.TOGGLE_VARIANT, verifyAdminToken, toggleProductVariant);
router.get(ROUTES.ADMIN.TOP_PRODUCTS, verifyAdminToken, topProducts);
router.post(ROUTES.ADMIN.ADD_PRODUCTS, uploadImages, addProduct);
router.get(
  ROUTES.ADMIN.EDIT_PRODUCT,
  verifyAdminToken,
  renderEditProductPage
);
router.patch(ROUTES.ADMIN.EDIT_PRODUCT, uploadImages, editProduct);
router.get(ROUTES.ADMIN.ADD_VARIANTS, verifyAdminToken, addVariantPage);
router.patch(
  ROUTES.ADMIN.ADD_NEW_VARIANTS,
  verifyAdminToken,
  uploadImages,
  addNewVariants
);

// Brand Router
router.get(ROUTES.ADMIN.BRANDS, verifyAdminToken, renderBrandPage);
router.get(ROUTES.ADMIN.SEARCH_BRANDS, verifyAdminToken, renderBrandPage);
router.patch(ROUTES.ADMIN.TOGGLE_BRAND, verifyAdminToken, toggleBrand);
router.get(ROUTES.ADMIN.ADD_NEW_BRAND, verifyAdminToken, renderAddBrandPage);
router.post(
  ROUTES.ADMIN.ADD_NEW_BRAND,
  verifyAdminToken,
  uploadBrandImage.single("image"),
  addBrand
);
router.get(ROUTES.ADMIN.EDIT_BRAND, verifyAdminToken, renderEditBrandPage);
router.patch(
  ROUTES.ADMIN.EDIT_BRAND,
  verifyAdminToken,
  uploadBrandImage.single("image"),
  editBrand
);
router.get(ROUTES.ADMIN.TOP_BRANDS, verifyAdminToken, topBrands);

// Category & Subcategory Routes
router.get(ROUTES.ADMIN.CATEGORY, verifyAdminToken, renderCategoryPage);
router.patch(ROUTES.ADMIN.TOGGLE_CATEGORY, verifyAdminToken, toggleCategory);
router.patch(ROUTES.ADMIN.TOGGLE_SUBCATEGORY, verifyAdminToken, toggleSubcategory);
router.get(ROUTES.ADMIN.ADD_CATEGORY, verifyAdminToken, renderAddCategoryPage);
router.post(
  ROUTES.ADMIN.ADD_SUBCATEGORY,
  verifyAdminToken,
  addSubcategoryToExistingCategory
);
router.post(ROUTES.ADMIN.ADD_CATEGORY, verifyAdminToken, addCategory);
router.get(ROUTES.ADMIN.EDIT_CATEGORY, verifyAdminToken, renderEditCategoryPage);
router.patch(ROUTES.ADMIN.EDIT_CATEGORY, verifyAdminToken, updateCategory);
router.get(ROUTES.ADMIN.ADD_OFFER_ID, verifyAdminToken, renderAddOfferPage);
router.get(ROUTES.ADMIN.TOP_CATEGORIES, verifyAdminToken, topCategories);
router.get(ROUTES.ADMIN.TOP_SUBCATEGORIES, verifyAdminToken, topSubCategories);
router.post(ROUTES.ADMIN.ADD_OFFER, verifyAdminToken, addOffer);
router.post(ROUTES.ADMIN.REMOVE_OFFER, verifyAdminToken, removeOffer);

// Users Routes
router.get(ROUTES.ADMIN.USERS, verifyAdminToken, renderUsersPage);
router.get(ROUTES.ADMIN.SEARCH_USER, verifyAdminToken, renderUsersPage);
router.put(ROUTES.ADMIN.BLOCK_USER, verifyAdminToken, blockUser);
router.put(ROUTES.ADMIN.UNBLOCK_USER, verifyAdminToken, unBlockUser);

// Coupon Routes
router.get(ROUTES.ADMIN.COUPONS, verifyAdminToken, renderCouponsPage);
router.post(ROUTES.ADMIN.ADD_COUPON, verifyAdminToken, addCoupon);
router.patch(ROUTES.ADMIN.REMOVE_COUPON, verifyAdminToken, removeCoupon);
router.patch(ROUTES.ADMIN.RESTORE_COUPON, verifyAdminToken, restoreCoupon);

// Order Routes
router.get(ROUTES.ADMIN.ORDERLISTS, verifyAdminToken, renderOrderPage);
router.patch(ROUTES.ADMIN.UPDATE_ORDER_STATUS, verifyAdminToken, updateOrderStatus);

// Settings Routes
router.get(ROUTES.ADMIN.SETTINGS, verifyAdminToken, renderSettingsPage);
router.patch(
  ROUTES.ADMIN.SETTINGS_UPDATE,
  verifyAdminToken,
  uploadProfileImage.single("profile-pic"),
  updateAdminProfile
);

export default router;
