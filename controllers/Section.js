const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");



exports.createSection = async (req, res) => {

    try {
        
        const {sectionName, courseId} = req.body;

        if(!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Fill all the required details"
            });
        }

        const addSection = await Section.create({sectionName: sectionName});

        // console.log("id", courseId);
        // add section to course
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: addSection._id,
                }
            },
            {new: true}
        )
        // HW: populate to replace section and subsection both in the updated course details
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();
        console.log("upd: ",updatedCourse);

        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            updatedCourse,
        })

    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Error while creating the section"
        });
    }

}



exports.updateSection = async (req, res) => {

    try {

        const {sectionNewName, sectionId, courseId} = req.body;

        console.log("s1",sectionNewName);
        // console.log("s2",scj);

        if(!sectionNewName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "Fill all the required details"
            });
        }

        const updatedSectionDetails = await Section.findByIdAndUpdate(
            {_id: sectionId},
            {sectionName: sectionNewName},
            {new: true},
        );


        const course = await Course.findById(courseId)
        .populate({
            path: "courseContent",
            populate: {
                path: "subSection",
            },
        })
        .exec();
        // .populate({
        //     path: "courseContent",
        //     populate: {
        //         path: "subSection",
        //     },
        // })
        // .exec();


        return res.status(200).json({
            success: true,
            message: updatedSectionDetails,
            data: course,
            // updatedSectionDetails,
        }) 


    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Error while updating the section"
        });
    }

}



exports.deleteSection = async (req, res) => {

    // try {

    //     // assuming that we are sending the ID in params
    //     // check for req.params
    //     const {sectionId} = req.params;

    //     await Section.findByIdAndDelete(sectionId);

    //     // TODO: do we need to delete the entry from the course schema ??

    //     return res.status(200).json({
    //         success: true,
    //         message: "Section deleted successfully",
    //     }); 
    // }

    try {

        const {sectionId, courseId} = req.body;

        if(!sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Fill all the required details"
            });
        }

        await Course.findByIdAndUpdate(courseId,{
            $pull: {
                courseContent: sectionId,
            }
        })


        const section = await Section.findById(sectionId);

        if(!section){
            return res.status(404).json({
                success: false,
                message: "Section not Found",
            })
        }


        // delete subSection
        await SubSection.deleteMany({_id: {$in: section.subSection}});

        const deletedSection = await Section.findByIdAndDelete(
            {_id: sectionId},
        );


        // const updatedCourse = await Course.findByIdAndUpdate(
        //     courseId,
        //     {
        //         $pop: {deletedSection}
        //     },
        //     {new: true},
        // )

        const course = await Course.findById(courseId).populate({
            path: "courseContent",
            populate: {
                path: "subSection"
            }
        }).exec();

        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data: course,
        }) 


    }
    catch (error) {
        console.log(error.message);
        return res.status(500).json({
            success: false,
            message: "Error while deleting the section"
        });
    }

}