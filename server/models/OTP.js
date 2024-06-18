const mongoose = require("mongoose");
const mailsender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
    email: {
        type:String,
        required: true,
    },
    otp: {
        type:String,
        required:true,
    },
    createdAt: {
        type:Date,
        default:Date.now(),
        expires: 5*60,
    }
});

// function to send email

async function sendVerificationEmail(email, otp) {
    try{

        const mailResponse = await mailsender(email, "Verification Email from StudyNotion", otp);
        console.log("Email sent Successfully", mailResponse);

    }
    catch(error){
        console.log("error occured while sending mail", error);
        throw error;

    }
}

OTPSchema.pre("save", async function(next) {
    await sendVerificationEmail(this.email, this.otp);
    next();
})


module.exports = mongoose.model("OTP", OTPSchema);

