const Course = require("../models/Course");
const Category = require("../models/Category");
const CourseProgress = require("../models/CourseProgress")
const User = require("../models/User");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");
const {uploadImageToCloudinary} = require("../utils/imageUploader");
const { convertSecondsToDuration } = require("../utils/convertData");


exports.createCourse = async (req, res) => {

    try{


        const {
            courseName, 
            courseDescription, 
            whatYouWillLearn, 
            price, 
            tag, 
            category, 
            status="Draft",
            instructions
        } = req.body;


        const thumbnail = req.files.thumbnail;

        console.log("rohit",req.files);
        // console.log(price,tag,category);


        if(
            !courseName || 
            !courseDescription || !whatYouWillLearn || 
            !price || 
            !tag || 
            !thumbnail ||
            !instructions ||
            !category 
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // if(!status) {
        //     status = "Draft";
        // } 

        
        const userId = req.user.id;
        const instructorDetails = await User.findById(userId);
        
        console.log("Instructor Details", instructorDetails);
        
        
        // TODO : verify that userId and instructor._id are same or different ?
        
        if(!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details not found",
            });
        }
        
        const CategoryDetails = await Category.findById(category);
        
        console.log("Category:", CategoryDetails);
        if(!CategoryDetails) {
            return res.status(404).json({
                success: false,
                message: "Tag Details not found",
            }); 
        }

        // console.log("ROhit1",thumbnail);
        const thumbnailImage = await uploadImageToCloudinary(thumbnail, process.env.FOLDER_NAME);
        
        // console.log("ROhit",thumbnailImage);


        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorDetails._id,
            whatYouWillLearn: whatYouWillLearn,
            price,
            tag: tag,
            category: CategoryDetails._id,
            status: status,
            instructions: instructions,
            thumbnail: thumbnailImage.secure_url, 
        });


        // add the new course to the user schema of the instructor
        await  User.findByIdAndUpdate(
            {_id: instructorDetails._id},
            {
                $push: {
                    courses: newCourse._id,
                }
            },
            {new: true},
        );

        // TODO: update the TAG ka schema

        const categoryDetails2 = await Category.findByIdAndUpdate(
          { _id: category },
          {
            $push: {
              courses: newCourse._id,
            },
          },
          { new: true }
        )


        return res.status(200).json({
            success: true,
            message: "Course Created Successfully",
            data: newCourse,
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while creating the course",
            error: error.message,
        });
    } 

}



exports.getAllCourses = async (req, res) => {

    try {

        // TODO : CHECK 
        const allCourses = await Course.find({}, {courseName: true,
            price: true,
            thumbnail: true,
            instructor: true,
            ratingAndReviews: true,
            studentsEnrolled: true,
        }).populate("instructor").exec();

        return res.status(200).json({
            success: true,
            message: "Data for all courses fetched successfully",
            data: allCourses,
        });

    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Error while fetching all the courses",
            error: error.message,
        });
    }

}



// getCourseDetails
exports.getCourseDetails = async (req, res) => {

    try{
        
        const {courseId} = req.body;
        // console.log("elkjhgvc");

        const courseDetails = await Course.findById({_id: courseId})
        .populate(
            {
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            }
        )
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();

        if(!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the course whie ${courseId}`,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course Details fetched successfully",
            data: courseDetails,
        })

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

} 



// copy




// Edit Course Details
exports.editCourse = async (req, res) => {
    try {
      const { courseId } = req.body
      const updates = req.body
      const course = await Course.findById(courseId)
  
      if (!course) {
        return res.status(404).json({ error: "Course not found" })
      }

      // console.log("up",updates);
  
      // If Thumbnail Image is found, update it
      if (req.files) {
        console.log("thumbnail update")
        const thumbnail = req.files.thumbnailImage
        const thumbnailImage = await uploadImageToCloudinary(
          thumbnail,
          process.env.FOLDER_NAME
        )
        course.thumbnail = thumbnailImage.secure_url
      }
  
      // console.log(1);
      // Update only the fields that are present in the request body
      for (const key in updates) {
        if (updates.hasOwnProperty(key)) {
          if (key === "tag" || key === "instructions") {
            course[key] = JSON.parse(updates[key])
          } else {
            course[key] = updates[key]
          }
        }
      }
      // console.log(2);
  
      await course.save();

      // console.log(3);
  
      const updatedCourse = await Course.findOne({_id:courseId})
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()

        // console.log(4);
        // console.log("updated Courses", updatedCourse);
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      });

    }
    
    catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
}


exports.getFullCourseDetails = async (req, res) => {
    try {
      console.log("10");  
      console.log("Request Params:", req.params); // Debugging

      const { courseId } = req.params;
      const userId = req.user.id
      // console.log("c",courseId, "f",userId);
      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()

        console.log(1,"c",courseDetails,8);
  
      let courseProgressCount = await CourseProgress.findOne({
        courseId: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgressCount)

      console.log(2);
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      // if (courseDetails.status === "Draft") {
      //   return res.status(403).json({
      //     success: false,
      //     message: `Accessing a draft course is forbidden`,
      //   });
      // }

      console.log(3,courseDetails);
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds)
  
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }
  
  // Get a list of Course for a given Instructor
  exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id

      console.log(2);
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 });

      console.log(4);
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        message: "Courses are Fetched successfully",
        data: instructorCourses,
      })
    } 
    catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }


  // Delete the Course
  exports.deleteCourse = async (req, res) => {
    try {
      console.log(100);
      const { courseId } = req.body

      console.log("courseId", courseId);
  
      // Find the course
      const course = await Course.findById(courseId)
      if (!course) {
        return res.status(404).json({ message: "Course not found" })
      }
  
      // Unenroll students from the course
      const studentsEnrolled = course.studentsEnrolled
      for (const studentId of studentsEnrolled) {
        await User.findByIdAndUpdate(studentId, {
          $pull: { courses: courseId },
        })
      }
  
      // Delete sections and sub-sections
      const courseSections = course.courseContent
      for (const sectionId of courseSections) {
        // Delete sub-sections of the section
        const section = await Section.findById(sectionId)
        if (section) {
          const subSections = section.subSection
          for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId)
          }
        }
  
        // Delete the section
        await Section.findByIdAndDelete(sectionId)
      }
  
      // Delete the course
      await Course.findByIdAndDelete(courseId)
  
      return res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      })
    } 
    catch (error) {
      console.error(error)
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      })
    }
  }