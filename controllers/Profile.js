// const { populate } = require("../models/Category");
const Profile = require("../models/Profile");
const User = require("../models/User");
const {uploadImageToCloudinary} = require('../utils/imageUploader');
const mongoose = require("mongoose")
const { convertSecondsToDuration } = require("../utils/convertData");
const CourseProgress = require("../models/CourseProgress");
const Course = require("../models/Course");

require("dotenv").config();

exports.updateProfile = async (req, res) => {

    try{

        const {dateOfBirth="", about="", contactNumber, gender=""} = req.body;

        const id = req.user.id;

        // if(!contactNumber || !gender || !id) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "All fields are required",
        //     });
        // }

        // find profile
        const userDetails = await User.findById(id);

        const profileId = userDetails.additionalDetails;

        const profileDetails = await Profile.findById(profileId);


        // update profile
        profileDetails.dataOfBirth = dateOfBirth;
        profileDetails.about = about;
        profileDetails.gender = gender;
        profileDetails.contactNumber = contactNumber;

        await profileDetails.save();


        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            profileDetails,
        });


    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error occured while updating the profile",
            error: error.message,
        });
    }

};


// delete account
// explore -> how can we schedule this deletion operation
exports.deleteAccount = async (req, res) => {

    try {

        const id = req.user.id;

        const userDetails = await User.findById(id);

        if(!userDetails){
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        await Profile.findByIdAndDelete({_id: userDetails.additionalDetails});

        // TODO: HW unenroll user from all enrolled courses

        await User.findByIdAndDelete({_id: id});


        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error occured while deleting the user account",
            error: error.message,
        });
    }

};



exports.getAllUserDetails = async (req, res) => {

    try{

        const id = req.user.id;

        const userDetails = await User.findById(id).populate("additionalDetails").exec();


        return res.status(200).json({
            success: true,
            message: "User data fetched success",
            userDetails,
        })

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error occured while fetching all the details of the User",
            error: error.message,
        });
    }

}



exports.updateDisplayPicture = async (req, res) => {

    try{
        const id = req.user.id;
        const displayPicture =  req.files.displayPicture;

        const image = await uploadImageToCloudinary(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        )
        console.log(image);
        if(!id || !image) {
            return res.status(401).json({
                success: false,
                message: "id not found",
            })
        }

        const updatedProfile = await User.findByIdAndUpdate(
            {_id: id},
            {
                image: image.secure_url,
            },
            {
                new: true,
            }
        )

        return res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            data: updatedProfile,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

};




exports.getEnrolledCourses = async (req, res) => {

    try {
        const userId = req.user.id;
        let userDetails = await User.findOne({
            _id: userId,
        })
        // .populate("courses")
        .populate({
            path: "courses",
            populate: {
                path: "courseContent",
                populate: {
                    path: "subSection",
                }
            }
        })
        .exec()


        console.log('g',userDetails.courses[0].courseContent.subSection);

        userDetails = userDetails.toObject();
        var SubsectionLength = 0;

        console.log('g',userDetails);

        for (var i = 0; i < userDetails.courses.length; i++) {
          let totalDurationInSeconds = 0
          SubsectionLength = 0;

          for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
            totalDurationInSeconds += userDetails.courses[i].courseContent[j].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
            userDetails.courses[i].totalDuration = convertSecondsToDuration(
              totalDurationInSeconds
            )
            SubsectionLength +=
              userDetails.courses[i].courseContent[j].subSection.length
          }
          let courseProgressCount = await CourseProgress.findOne({
            courseID: userDetails.courses[i]._id,
            userId: userId,
          })
          courseProgressCount = courseProgressCount?.completedVideos.length
          if (SubsectionLength === 0) {
            userDetails.courses[i].progressPercentage = 100
          } else {
            // To make it up to 2 decimal point
            const multiplier = Math.pow(10, 2)
            userDetails.courses[i].progressPercentage =
              Math.round(
                (courseProgressCount / SubsectionLength) * 100 * multiplier
              ) / multiplier
          }
        }



        if(!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could Not Find User With Id: ${userDetails}`,
            });
        }
        return res.status(200).json({
            success: true,
            data: userDetails.courses,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



//add 2 more handlers  updateDisplayPicture, getEnrolledCourses, and also defines routes 
exports.updateDisplayPicture = async (req, res) => {
    try {
      const displayPicture = req.files.displayPicture
      const userId = req.user.id
      const image = await uploadImageToCloudinary(
        displayPicture,
        process.env.FOLDER_NAME,
        1000,
        1000
      )
      console.log(image)
      const updatedProfile = await User.findByIdAndUpdate(
        { _id: userId },
        { image: image.secure_url },
        { new: true }
      )
      res.send({
        success: true,
        message: `Image Updated successfully`,
        data: updatedProfile,
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }




  exports.instructorDashboard = async (req, res) => {
    try {
      const courseDetails = await Course.find({ instructor: req.user.id })
  
      const courseData = courseDetails.map((course) => {
        const totalStudentsEnrolled = course?.studentsEnrolled?.length
        const totalAmountGenerated = totalStudentsEnrolled * course.price
  
        // Create a new object with the additional fields
        const courseDataWithStats = {
          _id: course._id,
          courseName: course.courseName,
          courseDescription: course.courseDescription,
          // Include other course properties as needed
          totalStudentsEnrolled,
          totalAmountGenerated,
        }
  
        return courseDataWithStats
      })
  
      res.status(200).json({ courses: courseData })
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: "Server Error" })
    }
  }