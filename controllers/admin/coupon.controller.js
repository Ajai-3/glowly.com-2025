import cron from "node-cron";
import User from "../../models/user.model.js";
import Coupon from "../../models/coupon.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import { COUPON_MESSAGES } from "../../constants/couponMessages.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";

// ========================================================================================
// RENDER COUPONS PAGE
// ========================================================================================
// This function renders the "Coupons" page for admins, allowing them to view, search,
// and manage the list of available coupons in the system.
// ========================================================================================
export const renderCouponsPage = async (req, res) => {
  const { page = 1, type = "all", isActive = "all" } = req.query;
  const limit = 10;

  try {
    const totalCouponsQuery = {};
    if (type !== "all") totalCouponsQuery.type = type;
    if (isActive !== "all") totalCouponsQuery.isActive = isActive === "true";
    const admin = await User.findOne({ _id: req.admin.id, role: "admin" });

    const totalCoupons = await Coupon.countDocuments(totalCouponsQuery);

    const coupons = await Coupon.find(totalCouponsQuery)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalPages = Math.ceil(totalCoupons / limit);
    const discountTypes = await Coupon.distinct("type");

    return res.render(VIEWS.ADMIN.COUPONS, {
      coupons,
      discountTypes,
      currentPage: parseInt(page, 10),
      totalPages,
      selectedType: type,
      selectedStatus: isActive,
      admin,
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(COUPON_MESSAGES.RENDER_PAGE_ERROR);
  }
};
// ========================================================================================
// ADD COUPON
// ========================================================================================
// This function allows admins to add a new coupon to the system, including details such
// as the coupon code, discount value, and applicable conditions or restrictions.
// ========================================================================================

export const addCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      value,
      limit,
      minPrice,
      maxPrice,
      startDate,
      expiryDate,
    } = req.body;

    const newCoupon = new Coupon({
      code,
      type: discountType,
      discountValue: value,
      expiryDate,
      startDate,
      minPrice,
      maxPrice,
      usageLimit: limit,
    });

    await newCoupon.save();

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: COUPON_MESSAGES.COUPON_ADDED,
    });
  } catch (error) {
    console.error(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(COUPON_MESSAGES.SAVE_ERROR);
  }
};

cron.schedule("* * * * *", async () => {
  try {
    const couponsToActivate = await Coupon.find({
      startDate: { $lte: new Date() },
      isActive: false,
      isDelete: false,
    });

    if (couponsToActivate.length > 0) {
      for (const coupon of couponsToActivate) {
        coupon.isActive = true;
        await coupon.save();
      }
    }

    const expiredCoupons = await Coupon.find({
      expiryDate: { $lt: new Date() },
      isActive: true,
      isDelete: false,
    });

    if (expiredCoupons.length > 0) {
      for (const coupon of expiredCoupons) {
        coupon.isActive = false;
        await coupon.save();
      }
    }
  } catch (error) {
    console.error("Error running cron job for coupon status update:", error);
  }
});

// ========================================================================================
// DELETE COUPON (SOFT DELETE)
// ========================================================================================
// This function allows admins to soft delete a coupon, marking it as inactive without
// permanently removing it from the system, ensuring it can be restored later if needed.
// ========================================================================================
export const removeCoupon = async (req, res) => {
  try {
    const { id } = req.body;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: COUPON_MESSAGES.COUPON_NOT_FOUND });
    }
    coupon.isDelete = true;

    await coupon.save();
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: COUPON_MESSAGES.COUPON_DELETED });
  } catch (error) {
    console.error("Error in deleting coupon", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: COUPON_MESSAGES.SERVER_ERROR });
  }
};

// ========================================================================================
// RESTORE COUPON
// ========================================================================================
// This function allows admins to restore a previously soft-deleted coupon, reactivating
// it in the system so that it can be used again by customers.
// ========================================================================================

export const restoreCoupon = async (req, res) => {
  try {
    const { id } = req.body;
    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: COUPON_MESSAGES.COUPON_NOT_FOUND });
    }
    coupon.isDelete = false;

    await coupon.save();
    return res
      .status(StatusCodes.OK)
      .json({ success: true, message: COUPON_MESSAGES.COUPON_RESTORED });
  } catch (error) {
    console.error("Error in restoring coupon", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: COUPON_MESSAGES.SERVER_ERROR });
  }
};
