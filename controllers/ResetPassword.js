
const User = require("../models/User");
const mailSender = require("../utils/mailSender");

const bcrypt = require("bcryptjs");
const crypto = require("crypto");   

exports.resetPasswordToken = async (req, res) => {

    try {

        const email = req.body.email;
        
        const user = await User.findOne({email: email});
        
        console.log("1",user);
        if(!user){
            return res.status(401).json({
                success: false,
                message: "Your Email is not registered with us"
            });
        }
        const token = crypto.randomUUID();
        console.log(token);
        const updatedDetails = await User.findOneAndUpdate(
            {email:email},
            {
                token: token,
                resetPasswordExpires: Date.now() + 10*60*1000,
            },
            {new: true},
        )
        console.log("User: ",user);
        console.log("Details: " ,updatedDetails);
        const url = `https://study-notion-dir2uxg3y-rohits-projects-6fe49551.vercel.app/update-password/${token}`;
        console.log("midlle");
        await mailSender(email,
            "Password Reset Link",
            `Password Reset Link: ${url}`
        );
        console.log("midlle 2");
        return res.status(200).json({
            success: true,
            message: "Email sent successfully, Please check email and change pwd",
        });
    }

    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending reset pwd mail"
        })
    }

}




// reset Password

exports.resetPassword = async (req, res) => {

    try {

        const {password, confirmPassword, token} = req.body;


        if(password !== confirmPassword) {
            return res.json({
                success: false,
                message: "Password not matching"
            });
        }

        const userDetails = await User.findOne({token: token});

        console.log(token);
        console.log(userDetails);

        if(!userDetails) {
            return res.json({
                success: false,
                message: "Token is invalid",
            });
        }


        if( userDetails.resetPasswordExpires < Date.now() ) {
            return res.json({
                success: false,
                message: "Token is expired, please regenerate your token",
            });
        }


        let hashPassword = await bcrypt.hash(password, 10);

        const updatedDetails = await User.findOneAndUpdate(
            {token: token},
            {password: hashPassword},
            {new: true},
        );

        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        })

    }

    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error occured while reset the password"
        })
    }

}