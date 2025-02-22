const Category = require("../models/Category");


exports.createCategory = async (req, res) => {

    try{

        const {name, description} = req.body;

        console.log("rrrrrrrrrrrrrr");

        if(!name || !description){
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const categoryDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log(categoryDetails);

        return res.status(200).json({
            success: true,
            message: "category created successfully",
        })
 
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message, 
        })
    }

};


// get All Category
exports.showAllCategory = async (req, res) => {

    try {
        
        const allCategory = await Category.find({}, {name: true, description: true});

        res.status(200).json({
            success: true,
            message: "All category returned successfully",
            allCategory,
        })

    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }

}



// category page details
exports.categoryPageDetails = async (req, res) => {

    try{
        // console.log("Request Params:", req.body); // DebuggingcategoryId

        const {categoryId} = req.body;

        // console.log("CategoryId1",categoryId);
        // find({_id: categoryId}) 

        const selectedCategory = await Category.findById(categoryId)
        .populate({
            path: "courses", 
            populate: {
                path: "instructor"
            },
        })
        .exec()

        
        if(!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "No courses for this category",
            });
        }
        
        // get courses for different category
        const differentCategories = await Category.find({
            _id: {$ne: categoryId},
        })
        .populate({
            path: "courses", 
            populate: {
                path: "instructor"
            },
        })
        .exec()
        
        // console.log("s",selectedCategory,"diff",differentCategories)

        // get top 10 selling courses
        //  TODO: HW - DO_IT

        // Get top-selling courses across all categories
        const allCategories = await Category.find()
        .populate({
            path: "courses", 
            populate: {
                path: "instructor"
            },
        })
        .exec()
        const allCourses = differentCategories.flatMap((category) => category.courses);
        const mostSellingCourses = allCourses
        // .sort((a, b) => b.sold - a.sold)
        // .slice(0, 10)
        // // console.log("mostSellingCourses COURSE", mostSellingCourses)



        return res.status(200).json({
            success: true,
            data: { 
                selectedCategory,
                differentCategories: allCourses,
                mostSellingCourses,
            },
        });


    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}