const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");
const cookieParser = require("cookie-parser");



// auth
exports.auth = async (req, res, next) => {

    try {
        console.log("cookie", req.cookies.token);
        const token = req.cookies.token || req.body.token || req.header("Authorization").replace("Bearer ", "");
        console.log("token 1", token);

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token not found",
            })
        }


        try {
            // console.log(5);
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            // console.log(6);
            req.user = decode;
            // console.log("decode: ",decode);
            console.log("user: ",req.user);

        } 
        catch (error) {
            return res.status(401).json({
                success: false,
                message: "Token is invalid"
            });
        }
        // console.log(3);
        next();

    }
    catch (err) {
        console.log(err.message);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while verifying the token",
        });
    }

}


// isStudent
exports.isStudent = async (req, res, next) => {

    try {
        
        // const role = req.user.accountType;
        // console.log("role",role);

        if(req.user.accountType !== "Student"){
            res.status(401).json({
                success: false,
                message: "This is a protected route for student"
            })
        }

        next();
        console.log("g",req.body);

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role is not matching"
        })    
    }

}


// isAdmin
exports.isAdmin = async (req, res, next) => {

    try {
        
        const role = req.user.accountType;
        console.log("role:", role);

        if(role !== "Admin"){
            res.status(401).json({
                success: false,
                message: "This is a protected route for Admin"
            })
        }

        next();

    }
    catch (error) {
        return res.status(500).json({
            success: false, 
            message: "User role is not matching"
        })    
    }

}




//isInstructor
exports.isInstructor = async (req, res, next) => {
    try {

        if(req.user.accountType !== 'Instructor') {
            return res.status(401).json({
                success: false,
                message: 'This Is A Protectd Route For Instructor'
            });
        }
        next();

    } catch(error) {
        return res.status(500).json({
            success: false,
            message: 'User Role Cannot Be Verified, Please Try Again'
        })
    }
}