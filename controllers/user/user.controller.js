import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import {
  generateOTP,
  generateResetCode,
  sendOTPToUserEmail,
  generateReferralCode,
  sendResetPasswordEmail,
} from '../../helpers/email.js';
import User from '../../models/user.model.js';
import Wallet from '../../models/wallet.model.js';
import { StatusCodes } from "../../constants/StatusCodes.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";
import { USER_MESSAGES } from "../../constants/userMessages.js";
import Transaction from '../../models/transaction.model.js';

// ========================================================================================
// RENDER LOGIN PAGE
// ========================================================================================
// Renders the login page for the user to authenticate their account.
// ========================================================================================
export const renderLoginPage = (req, res) => {
  const msg = req.session.msg || null;
  req.session.msg = null;
  const redirect = req.query.redirect || null;
  return res.render(VIEWS.USER.LOGIN, { msg, redirect });
};
// ========================================================================================
// RENDER SIGNUP PAGE
// ========================================================================================
// Renders the signup page for the user to create a new account.
// ========================================================================================
export const renderSignupPage = (req, res) => {
  const msg = req.session.msg || null;
  return res.render(VIEWS.USER.SIGNUP, { msg });
};
// ========================================================================================
// RENDER OTP MESSAGE PAGE
// ========================================================================================
// Renders the page displaying the OTP message sent to the user for verification.
// ========================================================================================
export const renderOtpStatusPage = (req, res) => {
  return res.render(VIEWS.USER.OTP_MESSAGE);
};
// ========================================================================================
// RENDER OTP VERIFICATION PAGE
// ========================================================================================
// Renders the OTP verification page where the user enters the code sent to their device.
// ========================================================================================
export const renderpOtpVerificationPage = (req, res) => {
  return res.render(VIEWS.USER.OTP_VERIFICATION);
};
// ========================================================================================
// RENDER FORGOT PASSWORD PAGE
// ========================================================================================
// Renders the forgot password page where the user can reset their password.
// ========================================================================================
export const renderForgotPasswordPage = (req, res) => {
  const msg = req.session.msg || null;
  req.session.msg = null;
  return res.render(VIEWS.USER.FORGOT_PASSWORD, { msg });
};
// ========================================================================================
// RENDER NEW PASSWORD PAGE
// ========================================================================================
// Renders the page where the user can set a new password after a successful reset.
// ========================================================================================

export const renderNewPasswordPage = async (req, res) => {
  try {
    const { code } = req.params;
    let msg = '';

    const user = await User.findOne({
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.session.msg = {
        type: 'error',
        msg: USER_MESSAGES.RESET_LINK_EXPIRED,
      };
      return res.redirect(ROUTES.USER.LOGIN);
    }

    return res.render(VIEWS.USER.NEW_PASSWORD, { email: user.email, msg });
  } catch (error) {
    console.log('Erorr rendering new password page', error);
  }
};

/////////////////////////////////////////////////////////////////////////////
/////////////////////////// USER OPERATIONS /////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

// ========================================================================================
// HASHED PASSWORD
// ========================================================================================
// Stores the user's password in a securely hashed format to ensure security and privacy.
// ========================================================================================
const hashedPassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error('Error in password hashing', error);
  }
};

// ========================================================================================
// HANDLE USER SIGNUP
// ========================================================================================
// Handles the process of a user creating a new account, including validation and storage.
// ========================================================================================
export const handleUserSignup = async (req, res) => {
  const { name, phone_no, email, password, repeatPassword } = req.body;

  try {
    const referer = req.headers.referer || '';

    const baseURL = referer.includes('localhost')
      ? 'http://localhost'
      : 'https://glowly.ajaiii.tech';
    const urlParams = new URL(referer, baseURL).searchParams;
    const referralCode = urlParams.get('referralCode') || null;

    const userExists = await User.findOne({ email });
    if (userExists) {
      const msg = USER_MESSAGES.EMAIL_ALREADY_EXISTS;
      return res.render(VIEWS.USER.SIGNUP, { msg });
    }

    const userPhoneNoExists = await User.findOne({ phone_no });
    if (userPhoneNoExists) {
      const msg = USER_MESSAGES.PHONE_ALREADY_EXISTS;
      return res.render(VIEWS.USER.SIGNUP, { msg });
    }

    // Check if the passwords match
    if (password !== repeatPassword) {
      const msg = USER_MESSAGES.PASSWORDS_NOT_MATCH;
      return res.render(VIEWS.USER.SIGNUP, { msg });
    }

    // Generate OTP and expiry time
    const { OTP, expiryTime } = generateOTP();
    req.session.otp = OTP;
    req.session.userOTP = OTP;
    req.session.otpExpiriy = expiryTime;
    req.session.userData = { name, phone_no, email, password, referralCode };

    console.log('OTP', OTP);

    // Send OTP to the user email
    const sendOTPEmail = await sendOTPToUserEmail(email, OTP);
    if (!sendOTPEmail) {
      const msg = USER_MESSAGES.OTP_SEND_ERROR;
      return res.render(VIEWS.USER.SIGNUP, { msg });
    }

    return res.redirect(ROUTES.USER.OTP_MESSAGE);
  } catch (error) {
    console.error('Signup error', error);
    res.redirect('/page-not-found');
  }
};

// ========================================================================================
// MANAGE OTP PROCESS
// ========================================================================================
// Manages the OTP process, including sending, entering, and verifying the OTP for
// user authentication.
// ========================================================================================
export const handleOTPVerification = async (req, res) => {
  try {
    let isRefferal = false;

    req.session.msg = 'Successful Login now';
    req.session.type = 'success';

    const { otp } = req.body;

    const referralCode = generateReferralCode();

    if (String(otp).trim() === String(req.session.userOTP).trim()) {
      const user = req.session.userData;
      const passwordHash = await hashedPassword(user.password);

      const saveUserData = new User({
        name: user.name,
        phone_no: user.phone_no,
        email: user.email,
        password: passwordHash,
        referralCode: referralCode,
        referredBy: null,
      });

      const newWallet = new Wallet({
        user_id: saveUserData._id,
        balance: 0,
      });

      await Promise.all([newWallet.save(), saveUserData.save()]);

      if (user.referralCode && user.referralCode !== '') {
        const referrer = await User.findOne({
          referralCode: user.referralCode,
        });
        console.log(referrer);

        if (referrer) {
          isRefferal = true;

          saveUserData.referredBy = new mongoose.Types.ObjectId(referrer._id);

          let referrerWallet = await Wallet.findOne({ user_id: referrer._id });
          let newUserWallet = await Wallet.findOne({
            user_id: saveUserData._id,
          });

          if (referrerWallet && newUserWallet) {
            const referralBonus = 100;

            referrerWallet.balance += referralBonus;
            newUserWallet.balance += referralBonus;

            const referrerTransaction = new Transaction({
              wallet_id: referrerWallet._id,
              user_id: referrer._id,
              amount: referralBonus,
              type: 'Credited',
              description: 'Referral bonus',
            });

            const newUserTransaction = new Transaction({
              wallet_id: newUserWallet._id,
              user_id: saveUserData._id,
              amount: referralBonus,
              type: 'Credited',
              description: 'Referral bonus',
            });

            await Promise.all([
              saveUserData.save(),
              referrerWallet.save(),
              newUserWallet.save(),
              referrerTransaction.save(),
              newUserTransaction.save(),
            ]);
          }
        }
      }

      const token = jwt.sign(
        { userId: saveUserData._id, name: saveUserData.name },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' },
      );

      res.cookie('token', token, { httpOnly: true, secure: true });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: USER_MESSAGES.SIGNUP_SUCCESS,
        redirectUrl: `/home?isReferral=${isRefferal}`,
      });
    } else {
      res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: USER_MESSAGES.INVALID_OTP });
    }
  } catch (error) {
    console.error('Error in verifing OTP', error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, msg: USER_MESSAGES.AN_ERROR_OCCURS });
  }
};

// ========================================================================================
// HANDLE THE RESEND OTP
// ========================================================================================
// Handles the process of sending and verifying an OTP for resetting the user's password.
// ========================================================================================
export const handleResendOTP = async (req, res) => {
  try {
    const user = req.session.userData;

    if (!user) {
      console.error('User data not passed');
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: USER_MESSAGES.USER_NOT_AUTHENTICATED });
    }

    const email = user.email;
    const phone_no = user.phone_no;

    const { OTP, expiryTime } = generateOTP();

    req.session.userOTP = OTP;

    const sendOTPEmail = await sendOTPToUserEmail(email, OTP);

    if (!sendOTPEmail) {
      console.error('Error sending OTP');
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: USER_MESSAGES.OTP_SEND_ERROR_RETRY,
      });
    }

    return res
      .status(StatusCodes.OK)
      .json({ success: true, msg: USER_MESSAGES.OTP_RESENT });
  } catch (error) {
    console.error('Error in resend OTP:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: USER_MESSAGES.SOMETHING_WENT_WRONG,
    });
  }
};

// ========================================================================================
// HANDLE USER LOGIN
// ========================================================================================
// Handles the process of authenticating a user with their credentials and logging them in.
// ========================================================================================
export const handleUserLogin = async (req, res) => {
  try {
    const { email, password, redirect } = req.body;

    const redirectPath = redirect || null;

    const referralCode = generateReferralCode();

    const user = await User.findOne({ email, role: 'user' });
    if (!user) {
      const msg = { type: 'error', msg: USER_MESSAGES.USER_NOT_FOUND };
      return res.render(VIEWS.USER.LOGIN, { msg, redirect: redirectPath });
    }

    if (user.status === 'blocked') {
      const msg = { type: 'error', msg: USER_MESSAGES.ACCOUNT_BLOCKED };
      return res.render(VIEWS.USER.LOGIN, { msg, redirect: redirectPath });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      const msg = { type: 'error', msg: USER_MESSAGES.INVALID_CREDENTIALS };
      return res.render(VIEWS.USER.LOGIN, { msg, redirect: redirectPath });
    }

    if (!user.referralCode) {
      user.referralCode = referralCode;
      await user.save();
    }

    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        profilePic: user.profilePic || null,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' },
    );
    res.cookie('token', token, { httpOnly: true, secure: true });

    if (redirectPath) {
      const sep = redirectPath.includes('?') ? '&' : '?';
      return res.redirect(
        `${redirectPath}${sep}msg=${encodeURIComponent(USER_MESSAGES.LOGIN_SUCCESS)}`,
      );
    }

    return res.redirect(ROUTES.USER.HOME_ALT + `?msg=${encodeURIComponent(USER_MESSAGES.LOGIN_SUCCESS)}`);
  } catch (error) {
    console.error('Login error', error);
    const msg = { type: 'error', msg: USER_MESSAGES.LOGIN_FAILED };
    res.render(VIEWS.USER.LOGIN, { msg, redirect: req.body.redirect || null });
  }
};

// ========================================================================================
// HANDLE THE LOGIN WITH GOOGLE ACCOUNT
// ========================================================================================
// Handles the process of authenticating the user via their Google account for login.
// ========================================================================================
export const googleCallbackHandler = async (req, res) => {
  try {
    if (req.user.status === 'blocked') {
      req.logout((err) => {
        if (err) {
          console.error('Logout error:', err);
          return res
            .status(StatusCodes.BAD_REQUEST)
            .send('An error occurred during logout');
        }
        return res.render(VIEWS.USER.LOGIN, {
          msg: { type: 'error', msg: USER_MESSAGES.ACCOUNT_BLOCKED },
        });
      });
      return;
    }

    let user = await User.findOne({ email: req.user.email });

    const referralCode = generateReferralCode();

    if (!user) {
      user = new User({
        email: req.user.email,
        name: req.user.displayName,
        googleId: req.user.googleId,
        referralCode: referralCode,
      });
      console.log('User before saving:', user);

      try {
        await user.save();
        console.log('User saved successfully:', user);
      } catch (err) {
        if (err.code === 11000) {
          user = await User.findOne({ email: req.user.email });
        } else {
          throw err;
        }
      }
    } else if (!user.googleId) {
      user.googleId = req.user.googleId;
      await user.save();
    } else if (!user.referralCode) {
      user.referralCode = referralCode;
      try {
        await user.save();
      } catch (err) {
        console.error('Error updating user:', err);
      }
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
    };

    const token = jwt.sign(
      {
        userId: user._id,
        name: user.name,
        profilePic: user.profilePic || null,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' },
    );

    res.cookie('token', token, { httpOnly: true, secure: true });

    const redirectPath = req.session.redirectAfterLogin || null;
    req.session.redirectAfterLogin = null;
    if (redirectPath) {
      const sep = redirectPath.includes('?') ? '&' : '?';
      return res.redirect(
        `${redirectPath}${sep}msg=${encodeURIComponent(USER_MESSAGES.LOGIN_SUCCESS)}`,
      );
    }
    return res.redirect(ROUTES.USER.HOME_ALT + `?msg=${encodeURIComponent(USER_MESSAGES.LOGIN_SUCCESS)}`);
  } catch (error) {
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// MANAGE PASSWORD RECOVERY
// ========================================================================================
// Manages the process of recovering the user's account through password reset or recovery options.
// ========================================================================================
export const handleForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const existUser = await User.findOne({ email, role: 'user' });
    if (!existUser) {
      return res.json({ type: 'error', msg: USER_MESSAGES.NO_USER_EMAIL });
    }

    const resetCode = generateResetCode();
    const expiryTime = Date.now() + 6 * 60 * 1000;
    existUser.resetPasswordCode = resetCode;
    existUser.resetPasswordExpires = expiryTime;
    await existUser.save();

    const resetPasswordUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetCode}`;
    const sendResetEmail = await sendResetPasswordEmail(
      email,
      resetPasswordUrl,
    );

    if (!sendResetEmail) {
      return res.json({
        type: 'error',
        msg: USER_MESSAGES.RESET_LINK_ERROR,
      });
    }

    return res.json({
      type: 'success',
      msg: USER_MESSAGES.RESET_LINK_SENT,
    });
  } catch (error) {
    console.error('Error in forgot password', error);
    return res.json({
      type: 'error',
      msg: USER_MESSAGES.AN_ERROR_OCCURRED,
    });
  }
};

// ========================================================================================
// RESET PASSWORD
// ========================================================================================
// Allows the user to set a new password after verifying their identity or reset request.
// ========================================================================================
export const handleResetPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render(VIEWS.USER.NEW_PASSWORD, {
        email,
        msg: USER_MESSAGES.PASSWORDS_NOT_MATCH,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render(VIEWS.USER.NEW_PASSWORD, { email, msg: USER_MESSAGES.USER_NOT_FOUND });
    }

    const updatedPassword = await hashedPassword(password);
    user.password = updatedPassword;

    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.session.msg = {
      type: 'success',
      msg: USER_MESSAGES.RESET_SUCCESS,
    };
    return res.redirect(ROUTES.USER.LOGIN);
  } catch (error) {
    console.error('Error resetting password', error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};
// ========================================================================================
// HANDLE PAGE NOT FOUND
// ========================================================================================
// Handles the scenario when the user navigates to a page that doesn't exist (404 error).
// ========================================================================================
export const pageNotFound = async (req, res) => {
  try {
    return res.render(ROUTES.USER.PAGE_NOT_FOUND);
  } catch (error) {
    console.error('Error in rendering page-not-found', error);
    return res.redirect(ROUTES.USER.PAGE_NOT_FOUND);
  }
};

// ========================================================================================
// MANAGE USER LOGOUT
// ========================================================================================
// Manages the process of logging the user out, including session termination and
// data clearing.
// ========================================================================================
export const handleUserLogout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(StatusCodes.BAD_REQUEST).send(USER_MESSAGES.LOGOUT_ERROR);
      }
      res.clearCookie('token');
      return res.redirect(ROUTES.USER.HOME_ALT);
    });
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(USER_MESSAGES.LOGOUT_UNEXPECTED_ERROR);
  }
};
