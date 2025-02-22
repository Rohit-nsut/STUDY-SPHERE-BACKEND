const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {

    try{
        
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.Mail_PASS,
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
        console.log(err.message);
    }
}

module.exports = mailSender;