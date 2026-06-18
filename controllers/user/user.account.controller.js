import jwt from "jsonwebtoken";
import User from "../../models/user.model.js";
import Address from "../../models/address.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";
import { USER_MESSAGES } from "../../constants/userMessages.js";
import { CATEGORY_MESSAGES } from "../../constants/categoryMessages.js";

// ========================================================================================
// RENDER MY ACCOUNT PAGE
// ========================================================================================
// Renders the user's account page, displaying personal details, order history, and
// account settings.
// ========================================================================================
export const renderMyAccountPage = async (req, res) => {
  try {
    const { user, token, brands, cartCount, categories } = req;

    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const activeUser = await User.findById({ _id: user.userId });

    return res.render(VIEWS.USER.MY_ACCOUNT, {
      name: user ? user.name : "",
      user: user,
      categories,
      brands,
      activeUser,
      cartCount,
    });
  } catch (error) {
    console.error("Error in rendering my account", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// HANDLE PROFILE UPDATE
// ========================================================================================
// Processes the update of the user's profile, including updating personal details like
// name, email, and date of birth.
// ========================================================================================
export const handleProfileUpdate = async (req, res) => {
  try {
    const { user } = req;

    const { name, dateOfBirth, phone_no } = req.body;
    const updatedData = { name, dateOfBirth, phone_no };

    if (req.file) {
      updatedData.profilePic = `/uploads/profile-pics/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(user.userId, updatedData, {
      new: true,
    });

    if (!updatedUser) {
      return res.status(StatusCodes.NOT_FOUND).send("User not found");
    }

    const newToken = jwt.sign(
      {
        userId: updatedUser._id,
        name: updatedUser.name,
        profilePic: updatedUser.profilePic || null,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("token", newToken, { httpOnly: true, secure: true });

    res.redirect(ROUTES.USER.MY_ACCOUNT);
  } catch (error) {
    console.log("Error in update profile", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// RENDER MANAGE ADDRESS PAGE
// ========================================================================================
// Renders the page where users can view, add, update, or delete their shipping addresses.
// ========================================================================================
export const renderManageAddressPage = async (req, res) => {
  try {
    const { user, token, brands, cartCount, categories } = req;

    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const addresses = await Address.find({
      user_id: user.userId,
      isActive: true,
    });

    return res.render(VIEWS.USER.MANAGE_ADDRESS, {
      name: user ? user.name : "",
      user: user,
      brands,
      categories,
      cartCount,
      addresses: addresses,
      activeUser: user,
    });
  } catch (error) {
    console.error("Error in rendering my account", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// HANDLE ADD ADDRESS
// ========================================================================================
// Processes the addition of a new shipping address for the user, saving it to their account.
// ========================================================================================
export const handleAddAddress = async (req, res) => {
  try {
    const { user, token, brands, cartCount, categories } = req;
    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const {
      city,
      district,
      state,
      country,
      address,
      pin_code,
      address_type,
      land_mark,
      alternative_phone_no,
      alternative_email,
    } = req.body;


    const activeUser = await User.findById(user.userId);
    if (!activeUser) {
      return res.status(StatusCodes.NOT_FOUND).send("User not found");
    }

    const addressCount = await Address.countDocuments({
      user_id: user.userId,
      isActive: true,
    });
    if (addressCount >= 4) {
      return res.render(VIEWS.USER.MANAGE_ADDRESS, {
        name: user ? user.name : "",
        user: user,
        categories,
        brands,
        activeUser,
        cartCount,
        addresses: await Address.find({ user_id: user.userId, isActive: true }),
        error: USER_MESSAGES.MAX_ADDRESSES_REACHED,
      });
    }

    const existingAddress = await Address.findOne({
      user_id: user.userId,
      city,
      district,
      state,
      country,
      address,
      pin_code,
      address_type,
      isActive: true,
    });

    if (existingAddress) {
      return res.redirect(ROUTES.USER.MANAGE_ADDRESS);
    }

    const newAddress = new Address({
      user_id: user.userId,
      city,
      district,
      state,
      country,
      address,
      pin_code,
      address_type,
      land_mark,
      alternative_phone_no,
      alternative_email,
      isActive: true,
    });

    await newAddress.save();

    const addresses = await Address.find({
      user_id: user.userId,
      isActive: true,
    });

    return res.render(VIEWS.USER.MANAGE_ADDRESS, {
      name: user ? user.name : "",
      user: user,
      categories,
      brands,
      activeUser,
      cartCount,
      addresses: addresses,
    });
  } catch (error) {
    console.error("Error in adding new address", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
//  ADDRESS REMOVED
// ========================================================================================
// The functionality for adding a new shipping address has been removed.
// ========================================================================================
export const removeAddress = async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res
        .status()
        .json({ message: USER_MESSAGES.UNAUTHORIZED });
    }

    const addressId = req.params.addressId;

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: USER_MESSAGES.ADDRESS_NOT_FOUND });
    }

    res.status(StatusCodes.OK).json({ message: USER_MESSAGES.ADDRESS_DEACTIVATED });
  } catch (error) {
    console.error("Error in removing address:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: USER_MESSAGES.ADDRESS_DEACTIVATE_ERROR, error });
  }
};

// ========================================================================================
// RENDER EDIT ADDRESS PAGE
// ========================================================================================
// Processes the editing of an existing shipping address for the user on the address page.
// ========================================================================================
export const editAddressPage = async (req, res) => {
  try {
    const { user, token, brands, cartCount, categories } = req;
    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }
    const { id } = req.params;

    const address = await Address.findById(id);

    if (!address) {
      return res.status(StatusCodes.NOT_FOUND).send(USER_MESSAGES.ADDRESS_NOT_FOUND);
    }

    return res.render(VIEWS.USER.EDIT_ADDRESS, {
      cartCount,
      categories,
      address,
      user,
      brands,
    });
  } catch (error) {
    console.error("Error in edit address Page", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// UPDATE ADDRESS
// ========================================================================================
// Processes the update of an existing shipping address for the user.
// ========================================================================================
export const updateAddress = async (req, res) => {
  try {
    const { city, district, state, country, address, pin_code } = req.body;
    const { addressId } = req.params;

    const existingAddress = await Address.findOne({
      user_id: req.user.userId,
      city,
      district,
      state,
      country,
      address,
      pin_code,
      _id: { $ne: addressId }, 
    });

    if (existingAddress) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: USER_MESSAGES.ADDRESS_ALREADY_EXISTS });
    }

    const updatedAddress = await Address.findByIdAndUpdate(addressId, req.body, {
      new: true,
    });

    if (!updatedAddress) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: USER_MESSAGES.ADDRESS_NOT_FOUND });
    }

    res.status(StatusCodes.OK).json({ message: USER_MESSAGES.ADDRESS_UPDATED });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: CATEGORY_MESSAGES.SERVER_ERROR });
  }
};
