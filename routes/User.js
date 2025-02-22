// import the required modules

const express = require("express");
const router = express.Router();


const {login, signup, sendOTP, changePassword, contactEmail} = require("../controllers/Auth");

const {resetPasswordToken, resetPassword} =  require("../controllers/ResetPassword");

const {auth} = require("../middlewares/auth");
  


//Routes for Login, Signup, and Authentication
 
//*******************************************************************************
//                          Authentication Routes
//*******************************************************************************

router.post("/login", login);

router.post("/signup", signup);

router.post("/sendotp", sendOTP);

router.post("/changepassword", auth, changePassword);

router.post("/contactEmail", contactEmail);





//**********************************************************************************
//                          Reset Password
//**********************************************************************************

//Route for generating a reset password token
router.post('/reset-password-token', resetPasswordToken);

//Route for resetting user's password after verification
router.post('/reset-password', resetPassword);

//Export the router for use in the main application
module.exports = router; 