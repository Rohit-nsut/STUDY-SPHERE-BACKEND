const mongoose = require("mongoose");

require("dotenv").config();

exports.dbConnect  = () => {
    mongoose.connect(process.env.MONGODB_URL, {
        // useNewurlParser: true,
        // useUnifiedTopology: true
    })
    .then( () => {console.log("Database is connected successfully")})
    .catch( (err) => {
        console.log("Issue in database connection");
        console.log(err.message);

        process.exit(1);
  
    })
};