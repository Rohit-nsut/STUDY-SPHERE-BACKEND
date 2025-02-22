//Import the required modules
const express = require('express');
const router = express.Router();

//Import the Controllers

//Course Controllers Import
const {
    createCourse,
    getAllCourses,
    getCourseDetails,
    editCourse,
    getInstructorCourses,
    deleteCourse,
    getFullCourseDetails
} = require('../controllers/Course');

//categories controller Import
const {
    showAllCategory,
    createCategory, 
    categoryPageDetails,
} = require('../controllers/Category');

//Sections controllers Import
const {
    createSection,
    updateSection, 
    deleteSection,
} = require('../controllers/Section');

//Sub-sections controllers Import
const {
    createSubSection,
    updateSubSection,
    deleteSubSection,
} = require('../controllers/Subsection');

//Rating Controllers Import
const {
    createRating,
    getAverageRating,
    getAllRatingAndReviews,
} = require('../controllers/RatingAndReview');

const { updateCourseProgress } = require("../controllers/CourseProgress");

//Importing Middlewares
const {auth, isInstructor, isStudent, isAdmin} = require('../middlewares/auth');

//*************************************************************************************
//                  Course Routes
//*************************************************************************************

//Courses can only be created by instructor
router.post('/createCourse', auth, isInstructor, createCourse);
// Get all Courses Under a Specific Instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses)
//Edit course
router.post('/editCourse', auth, isInstructor, editCourse);
//Add a Section to a Course
router.post('/addSection', auth, isInstructor, createSection);
//Update a Section
router.post('/updateSection', auth, isInstructor, updateSection);
//Delete a Section
router.post('/deleteSection', auth, isInstructor, deleteSection);
//Edit a Sub Section
router.post('/updateSubSection', auth, isInstructor, updateSubSection);
//Delete a Sub Section
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection);
//Add a Sub Section to a Section
router.post('/addSubSection', auth, isInstructor, createSubSection);
//Get all Registered Courses
router.get('/getAllCourses', getAllCourses);
//Get Details for a Specific Courses
router.post('/getCourseDetails', getCourseDetails);
//Delete Course
router.delete('/deleteCourse', auth, isInstructor, deleteCourse);
//getFullCourseDetails
router.get('/getFullCourseDetails/:courseId', auth, getFullCourseDetails);


router.post('/updateCourseProgress', auth, isStudent, updateCourseProgress);

//***********************************************************************
//              Category Routes (Only By Admin)
//***********************************************************************
router.post('/createCategory', auth, isAdmin, createCategory);
router.get('/showAllCategories', showAllCategory);
router.post('/getCategoryPageDetails', categoryPageDetails);


//*****************************************************************************
//              Rating And Review
//*****************************************************************************
router.post('/createRating', auth, isStudent, createRating);
router.get('/getAverageRating', getAverageRating);
router.get('/getReviews', getAllRatingAndReviews);


module.exports = router;