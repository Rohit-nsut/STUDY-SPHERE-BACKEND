const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");

const mailSender = require("../utils/mailSender");

const {courseEnrollment} = require("../mail/courseEnrollmentEmail");
const {paymentSuccessEmail} = require("../mail/paymentSuccessEmail");
const crypto = require("crypto");
const { default: mongoose } = require("mongoose");
const CourseProgress = require("../models/CourseProgress");


//initiate the razorpay order
exports.capturePayment = async (req, res) => {

    const {courses} = req.body;
    const userId = req.user.id;

    if(courses.length === 0){
        return res.json({
            success: false,
            message: "Please provide Course Id",
        });
    }

    let totalAmount = 0;

    for(const course_id of courses) {
        let course;

        try{
            course = await Course.findById(course_id);

            if(!course) {
                return res.status(500).json({
                    success: false,
                    message: "Could not find the course",
                });
            }

            const uid = new mongoose.Types.ObjectId(userId);

            if(course.studentsEnrolled.includes(uid)) {
                return res.status(200).json({
                    success: true,
                    message: "Student is already Enrolled",
                })
            }

            totalAmount += course.price;
        }

        catch(error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }


    }


    const options = {
        amount: totalAmount * 100,
        currency: "INR",
        receipt: Math.random(Date.now()).toString(),
    }

    try {
        
        const paymentResponse = await instance.orders.create(options);
        
        return res.status(200).json({
            success: true,
            message: paymentResponse,
        })

    } 
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Could not Initiate Order",
        });
    }
}




exports.verifyPayment = async (req, res) => {
    
    const courses = req.body?.courses;
    const userId = req.user.id;

    if (!courses || !userId) {
        return res.status(401).json({
            success: false,
            message: "Payment Verification Failed",
        });
    }

    try {
        await enrolledStudent(courses, userId, res);
        
        return res.status(200).json({
            success: true,
            message: "Payment Verification Skipped. Student Enrolled.",
        });

    } catch (error) {
        console.log("Enrollment Error", error);
        return res.status(500).json({
            success: false,
            message: "Could not enroll student",
        });
    }
};



//verify the Payment
// exports.verifyPayment = async (req, res) => {
    
//     const razorpay_order_id = req.body?.razorpay_order_id;
//     const razorpay_payment_id = req.body?.razorpay_payment_id;
//     const razorpay_signature = req.body?.razorpay_signature;
//     const courses = req.body?.courses;
//     const userId = req.user.id;


//     if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courses || ! userId) {
//         return res.status(401).json({
//             success: false,
//             message: "Payment Failed",
//         });
//     }

//     let body = razorpay_order_id + "|" + razorpay_payment_id;

//     const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)
//     .update(body.toString())
//     .digest("hex");


//     if(expectedSignature === razorpay_signature) {
        
//         await enrolledStudent(courses, userId, res);

//         return res.status(200).json({
//             success: true,
//             message: "Payment Verified",
//         })
//     }

//     return res.status(500).json({
//         success: false,
//         message: "Payment Failed",
//     })
// }


const enrolledStudent = async(courses, userId, res) => {

    if(!courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please Provide date for Courses or UserId",
        });
    }

    for(const courseId of courses) {

        try {

            const enrolledCourse = await Course.findOneAndUpdate(
                {_id: courseId},
                {
                    $push: {studentsEnrolled: userId},
                },
                {new: true},
            )
    
            if(!enrolledCourse) {
                return res.status(500).json({
                    success: false,
                    message: "Course not Found",
                });
            } 

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: [], 
            })
    
            const enrolledStudent = await User.findByIdAndUpdate(userId, {
                $push: {
                    courses: courseId,
                    courseProgress: courseProgress._id
                }
            }, {new: true});
            
            
            const emailResponse = await mailSender(
                enrolledStudent.email,
                `Successfully Enrolled into ${enrolledCourse.courseName}`,
                courseEnrollment(enrolledCourse.courseName, `${enrolledStudent.firstName}`)
            )
    
            console.log("Email sent Successfully", emailResponse.response);
            
        } 
        
        catch (error) {
            console.log(error);
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

    }

}


exports.sendPaymentSuccessEmail = async  (req, res) => {

    // console.log("55",req.body);
    const {orderId, paymentId, amount} = req.body;
    // console.log("5",orderId,paymentId,amount);

    const userId = req.user.id;

    if(!orderId || !paymentId || !amount || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please Provide all the fields",
        });
    }

    try {
        
        const enrolledStudent = await User.findById(userId);

        // console.log("enrolledStudent 6 ", enrolledStudent);

        setTimeout(async () => {
            await mailSender(
                enrolledStudent.email,
                `Payment Received`,
                paymentSuccessEmail(`${enrolledStudent.firstName}`, amount / 100, orderId, paymentId)
            );
        }, 1000);
        // console.log(7);

    } catch (error) {

        console.log("Error in sending email", error);
        return res.status(500).json({
            success: false,
            message: "Could not send Email",
        });
    }
}



 







// exports.capturePayment = async (req, res) => {

//     const {course_id} = req.body;
//     const userId = req.user.id;

//     if(!course_id) {
//         return res.json({
//             success: false,
//             message: "Please provide valid course ID",
//         });
//     };

//     let course;

//     try{
//         course = await Course.findById(course_id);
//         if(!course) {
//             return res.json({
//                 success: false,
//                 message: "Could not find the course",
//             });
//         }


//         const uid = new mongoose.Types.ObjectId(userId);
//         if(course.studentsEnrolled.includes(uid)) {
//             return res.status(200).json({
//                 success: false,
//                 message: "Student is already enrolled",
//             });
//         }
//     }
//     catch(error) {
//         console.error(error);
//         return res.status(500).json({
//             success: false,
//             message: error.message,
//         });
//     }


//     const amount = course.price;
//     const currency = "INR";

//     const options = {
//         amount: amount * 100,
//         currency,
//         receipt: Math.random(Date.now()).toString(),
//         notes: {
//             courseId: course_id,
//             userId,
//         }
//     };

//     try{
//         const paymentResponse = await instance.orders.create(options);
//         console.error(paymentResponse);

//         return res.status(200).json({
//             success: true,
//             courseName: course.courseName,
//             courseDescription: course.courseDescription,
//             thumbnail: course.thumbnails,
//             orderId: paymentResponse.id,
//             currency: paymentResponse.currency,
//             amount: paymentResponse.amount,
//         });

//     }
//     catch(error) {
//         console.error(error);
//         res.json({
//             success: false,
//             message: "Could not initiate order"
//         })
//     }

// };


// exports.verifySignature = async (req, res) => {

//     const webhookSecret = "12345678";

//     const signature = req.headers("x-razor-signature");

    
//     const shasum = crypto.createHmac("sha256", webhookSecret);
//     shasum.update(JSON.stringify(req.body));
//     const digest = shasum.digest("hex");


//     if(signature === digest) {
//         console.log("Payment is Authorised");

//         const {courseId, userId} = req.body.payload.payment.entity.notes;


//         try{

//             const enrolledCourse = await Course.findOneAndDelete(
//                 {_id: courseId},
//                 {$push: {studentsEnrolled: userId}},
//                 {new: true},
//             );

//             if(!enrolledCourse) {
//                 return res.status(500).json({
//                     success: false,
//                     message: "Course not Found",
//                 });
//             }


//             console.log(enrolledCourse);


//             const enrolledStudent = await User.findOneAndUpdate(
//                 {_id: userId},
//                 {$push: {courses: courseId}},
//                 {new: true},
//             );


//             const emailResponse = await mailSender(
//                 enrolledStudent.email,
//                 "Congratulations from CodeHelp",
//                 "Congratulations, you are onboarded into new CodeHelp Course",
//             );

//             console.log(emailResponse);

//             return res.sta(200).json({
//                 success: true,
//                 message: "Signature Verified and Course Added",
//             });


//         }

//         catch(error) {
//             console.log(error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message,
//             })
//         }
//     }

//     else {
//         return res.status(400).json({
//             success: false,
//             message: "Invalid request",
//         });
//     }

// }