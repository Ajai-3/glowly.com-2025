import Review from "../../models/review.model.js";
import Product from "../../models/product.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import { ROUTES } from "../../constants/routes.js";

// ========================================================================================
// ADD REVIEW
// ========================================================================================
// Allows users to add a review for a product, including rating and comment, which is
// stored and displayed on the product page.
// ========================================================================================
export const review = async (req, res) => {
  try {
    const { user } = req;
    const { productId, variantId, orderId, rating, review } = req.body;

    if (!productId || !variantId || !rating || !review) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: PRODUCT_MESSAGES.REVIEW_REQUIRED_FIELDS,
      });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: PRODUCT_MESSAGES.RATING_INVALID });
    }

    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: CART_MESSAGES.PRODUCT_NOT_FOUND });
    }

    const variant = product.variants.find(
      (variant) => variant._id.toString() === variantId
    );

    if (!variant) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: CART_MESSAGES.VARIANT_NOT_FOUND });
    }

    const newReview = new Review({
      userId: user.userId,
      productId,
      variantId,
      orderId,
      variantShade: variant.shade,
      rating,
      review,
      edited: false,
      verified: orderId ? true : false,
      createdAt: new Date(),
    });

    const savedReview = await newReview.save();

    const reviews = await Review.find({ productId });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const newAverageRating = totalRating / reviews.length;

    product.rating = newAverageRating;
    product.reviewCount += 1;
    await product.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ message: PRODUCT_MESSAGES.REVIEW_SUBMIT_SUCCESS, review: savedReview });
  } catch (error) {
    console.error("Error in submitting review", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// EDIT REVIEW
// ========================================================================================
// Allows users to edit an existing review for a product, updating the rating and comment
// in the system.
// ========================================================================================
export const editReview = async (req, res) => {
  try {
    const { user } = req;
    const { productId, variantId, orderId, rating, review } = req.body;
    const reviewId = req.params.reviewId;

    if (!productId || !variantId || !rating || !review) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: PRODUCT_MESSAGES.REVIEW_REQUIRED_FIELDS,
      });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: PRODUCT_MESSAGES.RATING_INVALID });
    }

    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: CART_MESSAGES.PRODUCT_NOT_FOUND });
    }

    const variant = product.variants.find(
      (variant) => variant._id.toString() === variantId
    );

    if (!variant) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: CART_MESSAGES.VARIANT_NOT_FOUND });
    }

    const existingReview = await Review.findOne({ _id: reviewId });

    if (!existingReview) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: PRODUCT_MESSAGES.REVIEW_NOT_FOUND });
    }

    if (existingReview.userId.toString() !== user.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: PRODUCT_MESSAGES.REVIEW_UNAUTHORIZED });
    }

    existingReview.rating = rating;
    existingReview.review = review;
    existingReview.edited = true;
    existingReview.verified = orderId ? true : false;
    existingReview.createdAt = new Date();
    existingReview.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: PRODUCT_MESSAGES.REVIEW_EDIT_SUCCESS });
  } catch (error) {
    console.error("Error in submitting review", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
