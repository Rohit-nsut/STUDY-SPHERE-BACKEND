const CourseProgress = require("../models/CourseProgress");
const SubSection = require("../models/SubSection");

// updateCourseProgress
exports.updateCourseProgress = async (req, res) => {
    // console.log('d',req.User);
    const {courseId, subSectionId} = req.body;

    const userId = req.user.id;
    console.log('c');

    try {
        
        const subSection = await SubSection.findById(subSectionId);

        console.log("s",subSection,userId,courseId);

        if(!subSection) {
            return res.status(404).json({ 
                error: "Invalid Subsection",
            })
        }

        let courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        });

        if(!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course Progress does not exist"
            });
        }
        else{
             //check for recompleting video/subsection
             if(courseProgress.completedVideos.includes(subSectionId)){
                return res.status(400).json({
                    error: "Subsection already completed",
                });
             }

             courseProgress.completedVideos.push(subSectionId);
        }

        await courseProgress.save();

        return res.status(200).json({
            success: true,
            message: "Course Progress Updated Successfully",
        })
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({
            error: "Internal Server Error",
        });
    }
}