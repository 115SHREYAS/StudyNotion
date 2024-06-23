const {instance} = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const {courseEnrollmentEmail} = require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");


// capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
    // get course id and user id 
    const {course_id} = req.body;
    const userId = req.user.id;

    // validation 
    if(!course_id) {
        return res.json({
            success:false,
            message:'Please provide valid course ID',
        })
    };

    let course;
    try{
        const courseDetails = await Course.findById(course_id);
        if(!course) {
            return res.json({
                success:false,
                message:'Could not find the course',
            });
        }

        // check if user is paying for same course again 

        const uid = new mongoose.Types.ObjectId(userId);
        if(course.studentEnrolled.includes(uid)) {
            return res.status(200).json({
                success:false,
                message:'Student is already enrolled',
            });
        }
    }
    catch(error) {
        console.error(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        });
    }
    // check if user already paid


    // order creation and response 

    const amount = course.price;
    const currency = "INR";
    const options = {
        amount: amount * 100,
        currency,
        receipt: Math.random(Date.now()).toString(),
        notes: {
            courseId: course_id,
            userId,
        }
    };

    try{
        // initatite the payment using razorpay
        const paymentResponse = await instance.orders.create(options);
        console.log(paymentResponse);

        return res.status(200).json({
            success:true,
            courseName:course.courseName,
            courseDescription: course.courseDescription,
            thumbnail: course.thumbnail,
            orderId: paymentResponse.id,
            currency:paymentResponse.currency,
            amount:paymentResponse.amount,
        });
    }
    catch(error) {
        console.log(error);
        res.json({
            success:false,
            message:"could not inititate order",
        });
    }
};

// verify signature of razorpay and server

exports.verifySignature = async (req, res) => {
    const webhookSecret = "12345678";

    const signature = req.headers["x-razorpay-signature"];

    const shasm = crypto.createHmac("sha256", webhookSecret);
    shasm.update(JSON.stringify(req.body));
    const digest = shasm.digest("hex");

    if(signature === digest) {
        console.log("Payment is authorized");

        const {courseId, userId} = req.body.payload.payment.entity.notes;

        try{
            // fullfil the action
            // find the course and enroll the student in course
            const enrolledCourse = await Course.findOneAndUpdate(
                                            {_id: courseId},
                                            {$push:{studentEnrolled: userId}},
                                            {new:true}
            );

            if(!enrolledCourse) {
                return res.status(500).json({
                    success:false,
                    message: 'Course not found',
                });
            }
            console.log(enrolledCourse);

            // find student and add course to list of enrolled courses 
            const enrolledStudent = await User.findOneAndUpdate(
                                            {_id:userId},
                                            {$push:{course:courseId}},
                                            {new:true},
            );
            console.log(enrolledStudent);

            // mail send 
            const emailResponse = await mailSender(
                                    enrolledStudent.email,
                                    "Congratulations from Codehelp",
                                    "Congratulations, you are onboarded into new codehelp Course ",
            );
            console.log(emailResponse);

            return res.status(200).json({
                success:true,
                message:"Signature Verified and Course Added",
            });
        }
        catch(error) {
            console.log(error);
            return res.status(500).json({
                success:false,
                message:error.message,
            });
        }
    }
    else {
        return res.status(400).json({
            success:false,
            message: 'Invalid Response',
        });
    }
}


