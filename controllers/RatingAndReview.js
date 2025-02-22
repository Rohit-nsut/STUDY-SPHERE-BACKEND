const RatingAndReview  = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");



// createRating
exports.createRating = async (req, res) => {
    console.log("fffffffffff");

    try{

        console.log("o",req.body);
        const  userId = req.user.id;


        const {rating, review, courseId} = req.body;

        console.log("a",userId,rating,review,courseId);


        const CourseDetails = await Course.findOne(
            {_id: courseId,
                studentsEnrolled: {$elemMatch: {$eq: userId}},
            }
        );

        console.log("p",CourseDetails);

        if(!CourseDetails) {
            return res.status(404).json({
            success: false,
            message: "Student is not Enrolled in the course",
            })
        }

        // check if user already reviewed or not
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId,
        });

        if(alreadyReviewed) {
            return res.status(403).json({
            success: false,
            message: "Course is already reviewed by the Student",
            });
        }

        const ratingReview = await RatingAndReview.create({user: userId, rating, review, course: courseId});

        
        // update in the course
        const updatingReview = await Course.findByIdAndUpdate(
            {_id: courseId},
            {
                $push: {ratingAndReviews: ratingReview._id},
            },
            {
                new: true,
            }
        );

        console.log(updatingReview);
    
        return res.status(200).json({
            success: true,
            message: "Rating and Review created Successfully",

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



// get average rating
exports.getAverageRating = async (req, res) => {

    try{

        const {courseId} = req.body;

        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId),
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: {$avg: "$rating"},
                }
            }
        ])


        if(result.length > 0) {
            return res.status(200).json({
                success: true,
                averageRating: result[0].averageRating,
            })
        }

        // if no Rating/Reviews is given till now 
        return res.status(200).json({
            success: true,
            message: "Average Rating is 0, no ratings given till now",
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




// get allRatingAndReviews
exports.getAllRatingAndReviews = async (req, res) => {

    try{

        const allReviews = await RatingAndReview.find({})
            .sort({rating: "desc"})
            .populate({
                path: "user",
                select: "firstName lastName email image"
            })
            // .populate({
            //     path: "course",
            //     select: "courseName",
            // })
            .exec();

        return res.status(200).json({
            success: true,
            message: "All reviews fetched successfully",
            data: allReviews,
        });
        

    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

} 