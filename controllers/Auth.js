const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");

const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender");

require("dotenv").config();

// send OTP
exports.sendOTP = async (req, res) => {

    try {
        
        const {email} = req.body;

        // console.log('1');

        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent){
            return res.status(401).json({
                success: false,
                message: "User already exist"
            })
        }

       //generate OTP -> not practical code for industry -> always use a lib. to generate a guranteed unique otp
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        console.log("OTP generated: ", otp);

        // check unique otp or not
        const result = await OTP.findOne({otp: otp});

        while(result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false,
            });
    
            console.log("OTP generated: ", otp);
    
            // result = await OTP.findOne({otp: otp});
        }

        const otpPayload = {email, otp};

        const otpBody = await OTP.create(otpPayload);

        console.log('OTP Body', otpBody);

        res.status(200).json({
            success: true,
            message: "OTP sent successfully",
            otp,
        })

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

}


// signUp
exports.signup = async (req, res) => {


    try {
        
        // data fetch from request 
        const {firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp} = req.body;


        // validate 
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
            return res.status(403).json({
                success: false,
                message: "Fill each entry"
            })
        }


        // match both password
        if(password !== confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password and confirm password donot match"
            })
        }


        // check if user already exist
        const existingUser = await User.findOne({email});

        if(existingUser){
            return res.status(400).json({
                success: false,
                message: "User already registered"
            });
        }
    
        console.log("p");
        // find most recent OTP stored for the user
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);

        console.log('recentOtp: ', recentOtp);

        // validate OTP
        if(recentOtp.length === 0){
            return res.status(404).json({
                success: false,
                message: "OTP not found"
            }) 
        }
        else if(otp !== recentOtp[0].otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
            });
        }
        
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // entry create

        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        });
        // console.log("rohit");
        
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password: hashedPassword,
            accountType: accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}${lastName}`,
        })

        // console.log("here");
        return res.status(200).json({
            success: true,
            user,
            message: "User is registered successfully"
        });


    }
    catch (error) {
        console.log(error);
        return  res.status(500).json({
            success: false,
            message: "User cannot be registered, Please try again"
        })
    }


}


// Login
exports.login = async (req, res) => {

    try {
        
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(403).json({
                success: false,
                message: "Fill all details"
            });
        }

        
        // check if user exist
        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({
                success: false,
                message: "User not registered, Please signup first"
            })
        }


        // match password
        if(await bcrypt.compare(password, user.password)){

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType, 
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET,{
                expiresIn: "24h",
            });

            // user.token = token; 
            const newUser = {...user.toObject(), token};
            newUser.password = undefined;

            const options = {
                expires: new Date(Date.now() + 3*24*60*60*1000),
                httpOnly : true,
            }
            console.log("newUser: ", newUser);
            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user: newUser,
                message: "User logged in successfully"
            })
        }

        else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect"
            });
        }


    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Login failure"
        })
    }
};


exports.contactEmail = async (req,res) => {

    try {
        console.log("g", req.body);
        const {Email, Message, FirstName , LastName} = req.body;
                
        const emailResponse = await mailSender(
            Email,
            `My Name is ${FirstName} ${LastName}`,
            Message,
        )
        
    }
    catch (error) {
        res.status(400).json({
            success: false,
            message: "Error in sending mail "
        })
    }
}


// change Password
exports.changePassword = async (req, res) => {

    try {
        
        const userDetails = await User.findById(req.user._id);

        const {oldPassword, newPassword} = req.body;

        if(await bcrypt(oldPassword, userDetails.password)){

            const encryptPassword = await bcrypt.hash(newPassword, 10);

            const updateUserDetails = await User.findByIdAndUpdate(req.user._id,
                {password: encryptPassword},
                {new : true}
            )

            try {
                
                const emailResponse = await mailSender(
                    updateUserDetails.email,
                    `Password updated successfully for ${updateUserDetails.firstName}  ${updateUserDetails.lastName}`,

                )
                
            }
            catch (error) {
                res.status(400).json({
                    success: false,
                    message: "Error in sending mail after updating the password"
                })
            }

            res.status(200).json({
                success: true,
                message: "Password updated successfully"
            })

        }

        else {
            return res.status(401).json({
                success: false,
                message: "Password donot match"
            })
        }

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error occured while updating the password"
        })
    }

}