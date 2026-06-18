import jwt from "jsonwebtoken";
import { ABSOLUTE, ROUTES, VIEWS } from "../constants/routes.js";
import { ADMIN_MESSAGES } from "../constants/adminMessages.js";


export const redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.adminToken;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.admin = decoded;
            return res.redirect(ABSOLUTE.ADMIN.DASHBOARD);
        } catch (error) {
            res.clearCookie("adminToken");
        }
    }
    next();
};

export const verifyAdminToken = (req, res, next) => {
    const token = req.cookies.adminToken;

    if (!token) {
        return res.render(VIEWS.ADMIN.LOGIN, {
            msg: ADMIN_MESSAGES.LOGIN_REQUIRED
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.admin = decoded;

        if (req.path === "admin/admin-login") {
            return res.render(VIEWS.ADMIN.DASHBOARD, {
                admin: req.admin
            });
        }

        next();
    } catch (error) {
        console.error("Token verification error:", error.message);
        res.clearCookie("adminToken");
        return res.render(VIEWS.ADMIN.LOGIN, { msg: ADMIN_MESSAGES.TOKEN_EXPIRED });
    }
};



export const pageMiddlware = (req, res, next) => {
    res.locals.currentPath = req.path;
    next();
}  


