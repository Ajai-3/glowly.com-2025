import express from "express";
import { ROUTES } from "../constants/routes.js";
import multer from "multer";
import passport from "../config/passport.js";
const router = express.Router();
import { uploadProfileImage } from "../helpers/cloudinary.js";
import { verifyToken, authenticateToken } from "../middlewares/auth.middleware.js";
import { loadUserData } from "../middlewares/loadUserData.midleware.js";
import { renderHomePage } from "../controllers/user/home.controller.js";
import {
  pageNotFound,
  handleUserLogin,
  handleResendOTP,
  renderLoginPage,
  renderSignupPage,
  handleUserSignup,
  handleUserLogout,
  handleResetPassword,
  renderOtpStatusPage,
  handleForgotPassword,
  handleOTPVerification,
  googleCallbackHandler,
  renderNewPasswordPage,
  renderForgotPasswordPage,
  renderpOtpVerificationPage,
} from "../controllers/user/user.controller.js";
import {
  renderShopPage,
  renderProductPage,
} from "../controllers/user/product-page.controller.js";
import {
  buyNow,
  addToCart,
  renderCartPage,
  removeCartProduct,
  updateCartPageProduct,
} from "../controllers/user/cart.controller.js";
import {
  addToWishlist,
  renderWishlistPage,
} from "../controllers/user/wishlist.controller.js";
import {
  removeAddress,
  updateAddress,
  editAddressPage,
  handleAddAddress,
  renderMyAccountPage,
  handleProfileUpdate,
  renderManageAddressPage,
} from "../controllers/user/user.account.controller.js";
import {
  placeOrder,
  verifyCoupon,
  paymentRetry,
  renderCheckoutPage,
  placeOrderWithBuyNow,
  verifyRazorpayPayment,
} from "../controllers/user/checkout.controller.js";
import {
  returnOrder,
  cancelOrder,
  orderDetailsPage,
  renderOrderListPage,
} from "../controllers/user/order.controller.js";
import {
  myWallet,
  addMoneyToWallet,
} from "../controllers/user/wallet.controller.js";
import { review, editReview } from "../controllers/user/review.controller.js";
import { myCoupons } from "../controllers/user/coupon.controller.js";
import { helpPage, getAppPage, privacyPolicy, termsAndCOnditions } from "../controllers/user/others.controller.js";
import { redeemReferral, shareAndEarn } from "../controllers/user/shareAndEarn.controller.js";

router.get(ROUTES.USER.HOME, loadUserData, renderHomePage);
router.get(ROUTES.USER.HOME_ALT, loadUserData, renderHomePage);
router.get(ROUTES.USER.LOGIN, verifyToken, renderLoginPage);
router.get(ROUTES.USER.SIGNUP, verifyToken, renderSignupPage);
router.get(ROUTES.USER.PAGE_NOT_FOUND, verifyToken, pageNotFound);
router.get(ROUTES.USER.RESET_PASSWORD_CODE, renderNewPasswordPage);
router.get(ROUTES.USER.OTP_MESSAGE, verifyToken, renderOtpStatusPage);
router.get(ROUTES.USER.FORGOT_PASSWORD, verifyToken, renderForgotPasswordPage);
router.get(ROUTES.USER.OTP_VERIFICATION, verifyToken, renderpOtpVerificationPage);
router.get(
  ROUTES.USER.AUTH_GOOGLE,
  (req, res, next) => {
    if (req.query.redirect) {
      req.session.redirectAfterLogin = req.query.redirect;
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  }
);
router.get(
  ROUTES.USER.AUTH_GOOGLE_CALLBACK,
  passport.authenticate("google", { failureRedirect: ROUTES.USER.SIGNUP }),
  googleCallbackHandler
);
router.post(ROUTES.USER.RESEND_OTP, handleResendOTP);
router.post(ROUTES.USER.RESET_PASSWORD, handleResetPassword);
router.post(ROUTES.USER.LOGIN, verifyToken, handleUserLogin);
router.post(ROUTES.USER.SIGNUP, verifyToken, handleUserSignup);
router.post(ROUTES.USER.FORGOT_PASSWORD, verifyToken, handleForgotPassword);
router.post(ROUTES.USER.OTP_VERIFICATION, verifyToken, handleOTPVerification);

// Product, Category & Sub Category Management
router.get(ROUTES.USER.SHOP, loadUserData, renderShopPage);
router.get(ROUTES.USER.PRODUCT_DETAIL, loadUserData, renderProductPage);

// Account Mangement
router.get(ROUTES.USER.MY_ACCOUNT, authenticateToken, loadUserData, renderMyAccountPage);
router.post(
  ROUTES.USER.MY_ACCOUNT,
  uploadProfileImage.single("profile-pic"),
  loadUserData,
  handleProfileUpdate
);

// Address Management
router.post(ROUTES.USER.ADD_ADDRESS, authenticateToken, loadUserData, handleAddAddress);
router.get(ROUTES.USER.MANAGE_ADDRESS, authenticateToken, loadUserData, renderManageAddressPage);
router.post(ROUTES.USER.REMOVE_ADDRESS, authenticateToken, loadUserData, removeAddress);

router.get(ROUTES.USER.EDIT_ADDRESS_ID, authenticateToken, loadUserData, editAddressPage);
router.post(ROUTES.USER.EDIT_ADDRESS_ACTION, authenticateToken, loadUserData, updateAddress);

// Cart Management
router.post(ROUTES.USER.BUY_NOW, loadUserData, buyNow);
router.get(ROUTES.USER.MY_CART, authenticateToken, loadUserData, renderCartPage);
router.post(ROUTES.USER.ADD_TO_CART, loadUserData, addToCart);
router.post(ROUTES.USER.REMOVE_CART_PRODUCT, loadUserData, removeCartProduct);
router.patch(ROUTES.USER.UPDATE_CART_PRODUCT, loadUserData, updateCartPageProduct);

// Checkout Mangement
router.get(ROUTES.USER.CHECKOUT, authenticateToken, loadUserData, renderCheckoutPage);
router.post(ROUTES.USER.PLACE_ORDER, authenticateToken, loadUserData, placeOrder);
router.post(ROUTES.USER.VERIFY_COUPON, authenticateToken, loadUserData, verifyCoupon);
router.get(ROUTES.USER.PLACE_ORDER_BUY_NOW, authenticateToken, loadUserData, placeOrderWithBuyNow);
router.post(ROUTES.USER.VERIFY_RAZORPAY, authenticateToken, loadUserData, verifyRazorpayPayment);

// Order Management
router.get(ROUTES.USER.MY_ORDERS, authenticateToken, loadUserData, renderOrderListPage);
router.patch(ROUTES.USER.CANCEL_ORDER, authenticateToken, loadUserData, cancelOrder);
router.patch(ROUTES.USER.RETURN_ORDER, authenticateToken, loadUserData, returnOrder);
router.post(ROUTES.USER.PAYMENT_FAILED_RETRY, authenticateToken, loadUserData, paymentRetry);
router.get(
  ROUTES.USER.ORDER_DETAILS_DETAIL,
  authenticateToken, loadUserData,
  orderDetailsPage
);
//Wish list Management
router.get(ROUTES.USER.MY_WISHLIST, authenticateToken, loadUserData, renderWishlistPage);
router.post(ROUTES.USER.ADD_TO_WISHLIST, authenticateToken, loadUserData, addToWishlist);

// Wallet Managent
router.get(ROUTES.USER.MY_WALLET, authenticateToken, loadUserData, myWallet);
router.post(ROUTES.USER.ADD_MONEY_TO_WALLET, authenticateToken, loadUserData, addMoneyToWallet);

// Coupon Management
router.get(ROUTES.USER.MY_COUPONS, authenticateToken, loadUserData, myCoupons);

// Rewview Mangement
router.post(ROUTES.USER.SUBMIT_REVIEW, loadUserData, review);
router.patch(ROUTES.USER.EDIT_REVIEW, loadUserData, editReview);

// Sare & Earn
router.get(ROUTES.USER.SHARE_AND_EARN, authenticateToken, loadUserData, shareAndEarn);
router.post(ROUTES.USER.REDEEM_REFERRAL, authenticateToken, loadUserData, redeemReferral);


// Other Page Management
router.get(ROUTES.USER.HELP, loadUserData, helpPage);
router.get(ROUTES.USER.GET_APP, loadUserData, getAppPage);
router.get(ROUTES.USER.PRIVACY, loadUserData, privacyPolicy)
router.get(ROUTES.USER.TERMS, loadUserData, termsAndCOnditions)

router.get(ROUTES.USER.LOGOUT, loadUserData, handleUserLogout);

export default router;
