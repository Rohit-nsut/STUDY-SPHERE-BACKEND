const nodemailer = require("nodemailer");
require("dotenv").config();

const mailSender = async (email, title, body) => {

    try{
        console.log("envuser ", process.env.MAIL_USER);
        console.log("envpass ", process.env.MAIL_PASS);
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            }
        });

        let info = await transporter.sendMail({
            from: "StudyNotion || by Rohit",
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });

        console.log("Info",info);
        return info;
    }

    catch (err) {
        console.log("EMAIL ERROR ",err.message);
    }
}

module.exports = mailSender;