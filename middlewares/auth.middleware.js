import jwt from "jsonwebtoken";
import dotenv from "dotenv"; dotenv.config();
import User from "../models/user.model.js";
import { ROUTES } from "../constants/routes.js";
import { StatusCodes } from "../constants/StatusCodes.js";
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;

export const verifyToken = async (req, res, next) => {
    const token = req.cookies.token;

    // List of restricted URLs
    const restrictedUrls = [
        ROUTES.USER.LOGIN,
        ROUTES.USER.SIGNUP,
        ROUTES.USER.OTP_MESSAGE,
        ROUTES.USER.NEW_PASSWORD,
        ROUTES.USER.FORGOT_PASSWORD,
        ROUTES.USER.OTP_VERIFICATION,
    ];

    const resetPasswordPattern = /^\/reset-password\/[a-f0-9]{24}$/;
    if (resetPasswordPattern.test(req.path)) {
        if (!token) {
            return next(); 
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY);
            if (decoded) {
                return res.redirect(ROUTES.USER.HOME_ALT); 
            }
        } catch (error) {
            // console.error("JWT Verification Error:", error);
            return next(); 
        }
    }
    if (resetPasswordPattern.test(req.path)) {
        if (!token) {
            return next(); 
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY);
            if (decoded) {
                return res.redirect(ROUTES.USER.HOME_ALT);
            }
        } catch (error) {
            // console.error("JWT Verification Error:", error);
            return next();
        }
    }
    
    if (restrictedUrls.includes(req.path)) {
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET_KEY);
                if (decoded) {
                    return res.redirect(ROUTES.USER.HOME_ALT);
                }
            } catch (error) {
                // console.error("JWT Verification Error:", error);
                return next();
            }
        }
        return next(); 
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET_KEY);
            if (decoded) {
                return next(); 
            }
        } catch (error) {
            // console.error("JWT Verification Error:", error.message);
            return res.redirect(ROUTES.USER.LOGIN); 
        }
    } else {
        return res.redirect(ROUTES.USER.HOME_ALT); 
    }
};



export const authenticateToken = (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  
    if (!token) {
      return res.redirect(ROUTES.USER.HOME_ALT); 
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      req.user = decoded; 
      next(); 
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.redirect(ROUTES.USER.HOME_ALT);
      }
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid token" });
    }
  };