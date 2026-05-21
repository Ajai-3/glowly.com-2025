import { ROUTES, VIEWS } from "../../constants/routes.js";

// ========================================================================================
// RENDER HELP PAGE
// ========================================================================================
// Renders the help page, providing users with FAQs, support contact information, and other assistance resources.
// ========================================================================================
export const helpPage = async (req, res) => {
  try {
    res.render(VIEWS.USER.HELP, {
      user: req.user,
    });
  } catch (error) {
    console.error("Error loading help page:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
// ========================================================================================
// GET APP PAGE
// ========================================================================================
// Retrieves and renders the application page, fetching necessary data and displaying it
// to the user.
// ========================================================================================
export const getAppPage = async (req, res) => {
  try {
    res.render(VIEWS.USER.GET_APP, {
      user: req.user,
      categories: req.categories,
      brands: req.brands,
      cartCount: req.cartCount,
    });
  } catch (error) {
    console.error("Error loading get app page:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
// ========================================================================================
// GET PRIVACY POLICY PAGE
// ========================================================================================
// Retrieves and renders the Privacy Policy page
// ========================================================================================
export const privacyPolicy = async (req, res) => {
  try {
    res.render(VIEWS.USER.PRIVACY, {
      user: req.user,
      categories: req.categories,
      brands: req.brands,
      cartCount: req.cartCount,
    });
  } catch (error) {
    console.error("Error loading get app page:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
// ========================================================================================
// GET TERMS AND CONDITIONS PAGE
// ========================================================================================
// Retrieves and renders the terms and conditions page
// ========================================================================================
export const termsAndCOnditions = async (req, res) => {
  try {
    res.render(VIEWS.USER.TERMS, {
      user: req.user,
      categories: req.categories,
      brands: req.brands,
      cartCount: req.cartCount,
    });
  } catch (error) {
    console.error("Error loading get app page:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
