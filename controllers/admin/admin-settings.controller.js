import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import User from "../../models/user.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import { ADMIN_MESSAGES } from "../../constants/adminMessages.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";

// ========================================================================================
// RENDER SETTINGS PAGE (ADMIN PROFILE UPDATE)
// ========================================================================================
// Renders the settings page for admins to update their profile.
// ========================================================================================
export const renderSettingsPage = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });
    return res.render(VIEWS.ADMIN.SETTINGS, { admin });
  } catch (error) {
    console.error("Settings page error:", error);
    return res.redirect(ROUTES.ADMIN.LOGIN);
  }
};

// ========================================================================================
// UPDATE ADMIN PROFILE
// ========================================================================================
// This function handles updating the admin's profile details (name, email, phone, profile pic).
// ========================================================================================

export const updateAdminProfile = async (req, res) => {
  try {
    const file = req.file;
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });

    if (req.file) {
      admin.profilePic = req.file.path || req.file.secure_url;
    }

    const updatedAdmin = await User.findByIdAndUpdate(
      admin._id,
      {
        name: req.body.name,
        email: req.body.email,
        phone_no: req.body.phone,
        profilePic: admin.profilePic,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: ADMIN_MESSAGES.PROFILE_UPDATED,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || ADMIN_MESSAGES.PROFILE_UPDATE_ERROR,
    });
  }
};
