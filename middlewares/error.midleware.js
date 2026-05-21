import { VIEWS } from "../constants/routes.js";
import { ADMIN_MESSAGES } from "../constants/adminMessages.js";
import { StatusCodes } from "../constants/StatusCodes.js";

export const notFoundHandler = (req, res) => {
    res.status(StatusCodes.NOT_FOUND).render(VIEWS.USER.PAGE_404, {
        statusCode: StatusCodes.NOT_FOUND,
        message: ADMIN_MESSAGES.PAGE_NOT_FOUND_TITLE,
    });
};

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    const message = err.message || 'Something went wrong';


    res.status(statusCode).render(VIEWS.USER.PAGE_404, {
        statusCode: statusCode,
        message: ADMIN_MESSAGES.SERVER_ERROR_TITLE,
    });
};
