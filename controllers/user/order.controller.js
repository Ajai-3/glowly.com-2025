import Order from "../../models/order.model.js";
import Review from "../../models/review.model.js";
import Product from "../../models/product.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import Transaction from "../../models/transaction.model.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";

// ========================================================================================
// RENDER ORDER LIST PAGE
// ========================================================================================
// Renders the page displaying the user's past orders, including order details and status.
// ========================================================================================
export const renderOrderListPage = async (req, res) => {
  try {
    const { user, token, brands, cartCount, categories } = req;
    const PAGE_SIZE = 6;
    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }
    const currentPage = parseInt(req.query.page) || 1;

    const allOrders = await Order.find({ user_id: user.userId })
      .populate({
        path: "products.product_id",
        select:
          "_id title description categoryId subcategoryId brandId variants",
      })
      .populate("address_id")
      .sort({ createdAt: -1 })
      .select(
        "_id user_id address_id products total_order_amount payment_method payment_status coupon_applied createdAt updatedAt"
      );

    const totalProductsCount = allOrders.length;
    const totalPages = Math.ceil(totalProductsCount / PAGE_SIZE);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    const paginatedOrders = allOrders.slice(startIndex, endIndex);

    return res.render(VIEWS.USER.MY_ORDERS, {
      user,
      brands,
      categories,
      cartCount,
      orders: paginatedOrders,
      currentPage,
      totalPages,
    });
  } catch (error) {
    console.error("Error in rendering order list:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// CANCEL ORDER
// ========================================================================================
// Cancels a user's order, updating the order status and processing any necessary refunds.
// ========================================================================================
export const cancelOrder = async (req, res) => {
  try {
    const { token, user, wallet } = req;
    const { orderId, productId, variantId, quantity } = req.body;
    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    if (!productId || !variantId || !orderId || !quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: ORDER_MESSAGES.MISSING_DATA });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: ORDER_MESSAGES.PRODUCT_NOT_FOUND });
    }

    const variant = await product.variants.id(variantId);
    if (!variant) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: ORDER_MESSAGES.VARIANT_MISSING });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: ORDER_MESSAGES.ORDER_LIST_NOT_FOUND });
    }

    const productInOrder = order.products.find(
      (item) =>
        item.product_id.toString() === productId &&
        item.variant_id.toString() === variantId
    );
    if (!productInOrder) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: ORDER_MESSAGES.PRODUCT_NOT_IN_ORDER });
    }

    if (
      productInOrder.status === "processing" ||
      productInOrder.status === "pending"
    ) {
      variant.stockQuantity += productInOrder.quantity;

      productInOrder.status = "canceled";
      productInOrder.canceled_at = new Date();

      if (order.payment_method === "wallet" || order.payment_method === "razorpay") {
        const refundAmount = productInOrder.amount_after_coupon;
        wallet.balance += refundAmount;
        const transaction = new Transaction({
          user_id: user.userId,
          order_id: orderId,
          wallet_id: wallet._id,
          amount: refundAmount,
          type: "Refund",
          description: "Order canceled",
        });

        await Promise.all([wallet.save(), transaction.save()]);
      }

      await Promise.all([product.save(), order.save()]);
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: ORDER_MESSAGES.CANCEL_SUCCESS });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// RETURN ORDER
// ========================================================================================
// Processes the return of a user's order, including updating the order status and initiating the return process.
// ========================================================================================
export const returnOrder = async (req, res) => {
  try {
    const { token } = req;
    const { orderId, productId, variantId, quantity } = req.body;

    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    if (!productId || !variantId || !orderId || !quantity) {
return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: ORDER_MESSAGES.MISSING_DATA });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: ORDER_MESSAGES.PRODUCT_NOT_FOUND });
    }

    const variant = await product.variants.id(variantId);
    if (!variant) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: ORDER_MESSAGES.VARIANT_MISSING });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: ORDER_MESSAGES.ORDER_LIST_NOT_FOUND });
    }

    const productInOrder = order.products.find(
      (item) =>
        item.product_id.toString() === productId &&
        item.variant_id.toString() === variantId
    );
    if (!productInOrder) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: ORDER_MESSAGES.PRODUCT_NOT_IN_ORDER });
    }

    const addressId = order.address_id;
    if (!addressId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: ORDER_MESSAGES.RETURN_NO_DELIVERY_DATE,
      });
    }

    const deliveredAt = new Date(productInOrder.delivered_at);
    const currentDate = new Date();
    const diffInDays = Math.floor((currentDate - deliveredAt) / (1000 * 60 * 60 * 24)); 

    if (diffInDays > 7) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: ORDER_MESSAGES.RETURN_DENIED_7_DAYS,
      });
    }

    productInOrder.status = "return_requested";
    productInOrder.return_reqested_at = new Date();

    await order.save();

    res.status(StatusCodes.OK).json({ success: true, message: ORDER_MESSAGES.RETURN_REQUEST_SENT });
  } catch (error) {
    console.error("Error canceling order:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};


// ========================================================================================
// RENDER ORDER DETAILS PAGE
// ========================================================================================
// Renders the page displaying the details of a specific order, including product information,
// quantities, prices, and the order status.
// ========================================================================================
export const orderDetailsPage = async (req, res) => {
  try {
    const { user, brands, token, cartCount, categories } = req;
    const { orderId, productId, variantId } = req.params;
    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const review = await Review.findOne({
      userId: user.userId,
      productId: productId,
      variantId: variantId,
    });

    const order = await Order.findById(orderId)
      .populate({
        path: "products.product_id",
        select:
          "_id title description categoryId subcategoryId brandId variants",
      })
      .populate("address_id");

    if (!order) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const product = order.products.find(
      (p) =>
        p.product_id._id.toString() === productId &&
        p.product_id.variants.some(
          (variant) => variant._id.toString() === variantId
        )
    );

    if (!product) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const variant = product.product_id.variants.find(
      (v) => v._id.toString() === variantId
    );
    if (!variant) {
      return res.redirect(ROUTES.USER.HOME_ALT);
    }

    const address = order.address_id;
    const productStatus = product.status || "Unknown";

    return res.render(VIEWS.USER.ORDER_DETAILS, {
      user,
      categories,
      review,
      brands,
      order,
      orderId,
      product,
      variant,
      address,
      cartCount,
      productStatus,
    });
  } catch (error) {
    console.error("Error in product detail page:", error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
