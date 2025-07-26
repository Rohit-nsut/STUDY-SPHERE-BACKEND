const express = require("express");
const app = express();


const userRoutes = require("./routes/User");
const profileRoutes = require("./routes/Profile");
const paymentRoutes = require("./routes/Payment");
const courseRoutes = require("./routes/Course");


const database = require("./config/database");
const cookieParser = require("cookie-parser");

// cors for both frontend and backend
const cors = require("cors");

const {cloudinaryConnect} = require("./config/cloudinary");

const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");


dotenv.config();
const PORT = process.env.PORT || 5000;


database.dbConnect();

// for middleware
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    "http://localhost:3000",  // Local frontend (for development)
    "https://study-sphere-rust.vercel.app/"  // Latest Vercel frontend link
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp",
    })
);

cloudinaryConnect();

// routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/course", courseRoutes);
app.use("/api/v1/payment", paymentRoutes);


// define route
app.get("/", (req, res) => {
    return res.json({
        success: true,
        message: "Your server is up and running",
    });
});

app.listen(PORT, () => {
    console.log(`App is running at ${PORT}`)
})