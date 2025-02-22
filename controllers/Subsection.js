const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");



exports.createSubSection = async (req, res) => {

    try {
        
        const {sectionId, title, description} = req.body;

        // extract video files
        const video = req.files.video;

        console.log("files", req.files);

        console.log("video ",video);


        if(!sectionId || !title  || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }
   

        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);


        const subSectionDetails = await SubSection.create({
            title: title,
            timeDuration: `${uploadDetails.duration}`,
            description: description,
            videoUrl: uploadDetails.secure_url,
        });

        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push:{subSection: subSectionDetails._id},
            },
            {new: true},
        ).populate("subSection").exec();

        console.log("updatedSection", updatedSection);

        // HW: log updated section here, after adding populate query


        return res.status(200).json({
            success: true,
            message: "Sub-Section is created successfully",
            data: updatedSection
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


// HW: update SubSection
// HW: delete SubSection

// copy kiya ha ya


//update the sub-section
exports.updateSubSection = async (req, res) => {
    try {
        const {sectionId, subSectionId, title, description} = req.body;
        const subSection = await SubSection.findById(subSectionId);

        if(!subSection) {
            return res.status(404).json({
                success: false,
                message: "SubSection not found",
            });
        }

        if(title !== undefined) {
            subSection.title = title;
        }

        if(description !== undefined) {
            subSection.description = description;
        }

        if(req.files && req.files.video !== undefined) {
            const video = req.files.video;
            const uploadDetails = await uploadImageToCloudinary(
                video,
                process.env.FOLDER_NAME,
            )
            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`
        }

        await subSection.save();

        const updatedSection = await Section.findById(sectionId).populate("subSection");

        return res.json({
            success: true,
            message: "Section updated Successfully",
            data: updatedSection
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while updating the section",
        })
    }
};





exports.deleteSubSection = async (req, res) => {
    try {
        const {subSectionId, sectionId} = req.body;
        console.log(1,subSectionId,"a",sectionId);
        await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: {
                    subSection: subSectionId,
                },
            }
        )
        console.log(2,subSectionId);
        const subSection = await SubSection.findByIdAndDelete(subSectionId);

        console.log(3,subSectionId);

        if(!subSection) {
            return res
                .status(404)
                .json({
                    success: false,
                    message: "SubSection Not Found",
                })
        }

        const updatedSection = await Section.findById(sectionId).populate("subSection");


        return res.json({
            success: true,
            message: "SubSection Deleted Successfully",
            data: updatedSection
        })

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An Error Occurred While Deleting the SubSection",
        })
    }
}