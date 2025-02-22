// import the required modules

const express = require("express");
const router = express.Router();



// import the controller
const { capturePayment, verifyPayment, sendPaymentSuccessEmail } = require("../controllers/Payments");
const {auth, isInstructor, isStudent, isAdmin} = require("../middlewares/auth");




// define api routes

router.post("/capturePayment", auth, isStudent, capturePayment);

router.post("/verifyPayment", auth, isStudent,  verifyPayment);
router.post("/sendPaymentSuccessEmail", auth, isStudent, sendPaymentSuccessEmail);



module.exports = router;