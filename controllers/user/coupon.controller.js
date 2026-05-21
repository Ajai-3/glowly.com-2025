import Coupon from "../../models/coupon.model.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";

// ========================================================================================
// RENDER MY COUPONS PAGE
// ========================================================================================
// Renders the page displaying all available and redeemed coupons for the user.
// ========================================================================================
export const myCoupons = async (req, res) => {
  try {
    let { user, cart, brands, cartCount, token, categories } = req;

    let coupons = await Coupon.find({ isDelete: false, isActive: true }).sort({
      created_at: -1,
    });

    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    return res.render(VIEWS.USER.MY_COUPONS, {
      user,
      name: user ? user.name : "",
      cartCount,
      coupons,
      brands,
      categories,
    });
  } catch (error) {
    console.log("Error in my coupons:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
