import mongoose from "mongoose";
import User from "../../models/user.model.js";
import Wallet from "../../models/wallet.model.js";
import { StatusCodes } from "../../constants/StatusCodes.js";
import Transaction from "../../models/transaction.model.js";
import { ROUTES, VIEWS } from "../../constants/routes.js";
import { USER_MESSAGES } from "../../constants/userMessages.js";

// ========================================================================================
// SHARE & EARN PAGE CONTROLLER
// ========================================================================================
// Renders the "Share & Earn" page where users can invite others, earn rewards,
// and track their referral bonuses.
// ========================================================================================
export const shareAndEarn = async (req, res) => {
    try {
        const { user, brands, token, wallet, cartCount, categories } = req;

        if (!token) {
            return res.redirect(ROUTES.USER.HOME_ALT);
        }

        const userData = await User.findById({ _id: user.userId })

        return res.render(VIEWS.USER.SHARE_EARN, {
            user,
            name: user ? user.name : "",
            userData,
            cartCount,
            wallet,
            brands,
            categories,
        });
    } catch (error) {
        console.error("Error rendering Share & Earn page:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(CART_MESSAGES.INTERNAL_SERVER_ERROR);
    }
};


// ========================================================================================
// REDEEM REFERRAL CODE CONTROLLER
// ========================================================================================
// Redeems a referral code and adds the referral bonus to the user's wallet.
// ========================================================================================
export const redeemReferral = async (req, res) => {
    try {
        const { user } = req;

        const { code } = req.body;

        const userIndb = await User.findOne({ referralCode: code });
        if (!userIndb) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: USER_MESSAGES.INVALID_REFERRAL_CODE });
        }

        if (user.userId.toString() === userIndb._id.toString()) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: USER_MESSAGES.OWN_REFERRAL_CODE });
        }

        const currentUser = await User.findById({ _id: user.userId })
        if (currentUser.referredBy) {
            return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: USER_MESSAGES.REFERRAL_ALREADY_CLAIMED });
        }

        if (user.userId.toString() !== userIndb._id.toString()) {
            
            userIndb.referredUsers.push(new mongoose.Types.ObjectId(currentUser._id));
            currentUser.referredBy = new mongoose.Types.ObjectId(userIndb._id);

            let userIndbWallet = await Wallet.findOne({ user_id: userIndb._id });
            let currentUserWallet = await Wallet.findOne({ user_id: user.userId });
        
            console.log("Current User Wallet:", currentUserWallet);
            console.log("Referred User Wallet:", userIndbWallet);
        
            if (userIndbWallet && currentUserWallet) {

                const referralBonus = 100;
    
                userIndbWallet.balance += referralBonus;
                let newTransactionReferred = new Transaction({
                    wallet_id: userIndbWallet._id,
                    user_id: userIndb._id,
                    amount: referralBonus,
                    type: "Credited",
                    description: "Referral bonus",
                });
        

                currentUserWallet.balance += referralBonus;
                let newTransactionReferrer = new Transaction({
                    wallet_id: currentUserWallet._id,
                    user_id: user.userId,
                    amount: referralBonus,
                    type: "Credited",
                    description: "Referral bonus",
                });

                await Promise.all([
                    userIndb.save(),
                    currentUser.save(),
                    userIndbWallet.save(),
                    currentUserWallet.save(),
                    newTransactionReferred.save(),
                    newTransactionReferrer.save(),
                ]);

                return res.status(StatusCodes.OK).json({ 
                    success: true, 
                    message: `₹ ${referralBonus} referral bonus credited.`,
                    showConfetti: true
                });
            }
        }
        
        
    } catch (error) {
        console.error("Error redeeming referral code:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(CART_MESSAGES.INTERNAL_SERVER_ERROR);
    }
}