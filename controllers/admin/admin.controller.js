import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../../models/user.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import { ADMIN_MESSAGES } from "../../constants/adminMessages.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";

// ========================================================================================
// RENDER ADMIN LOGIN PAGE
// ========================================================================================
// This function renders the admin login page for administrators to log in to the system.
// ========================================================================================
export const renderLoginPage = (req, res) => {
  if (req.session.admin) {
    return res.redirect(ROUTES.ADMIN.DASHBOARD);
  }
  const msg = req.query.msg || "";

  res.render(VIEWS.ADMIN.LOGIN, { msg });
};

// ========================================================================================
// HANDLE ADMIN LOGIN
// ========================================================================================
// This function processes the admin login request, validating the provided credentials
// and granting access to the admin dashboard upon successful login.
// ========================================================================================
export const handleAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: "admin" });

    if (!admin) {
      return res.render(VIEWS.ADMIN.LOGIN, { msg: ADMIN_MESSAGES.ADMIN_NOT_FOUND });
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.render(VIEWS.ADMIN.LOGIN, { msg: ADMIN_MESSAGES.INVALID_CREDENTIALS });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "2h" }
    );

    res.cookie("adminToken", token, {
      httpOnly: true,
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.redirect(ROUTES.ADMIN.DASHBOARD);
  } catch (error) {
    console.error("Error during admin login:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(ADMIN_MESSAGES.LOGIN_ERROR);
  }
};

// ========================================================================================
// HANDLE ADMIN LOGOUT
// ========================================================================================
// This function processes the admin logout request, clearing the session and
// redirecting the admin to the login page, ensuring a secure log-out process.
// ========================================================================================
export const handleAdminLogout = (req, res) => {
  try {
    res.clearCookie("adminToken", { httpOnly: true, secure: false });

    return res.redirect(ROUTES.ADMIN.LOGIN + "?msg=Logged%20out%20successfully");
  } catch (error) {
    console.error("Unexpected error during logout:", error);
    res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
