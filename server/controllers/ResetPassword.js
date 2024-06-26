const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");

// resetPasswordToken

exports.resetPasswordToken = async (req, res) => {
    try{
                // get email from req body
        const email = req.body.email;

        // check user for this email, email verification
        const user = await User.findOne({email: email});

        if(!user) {
            return res.json({
                success:false, 
                message:'Your Email is not registered with us'
            });
        }
        // generate token
        const token = crypto.randomBytes(20).toString("hex");
        // update user by adding token and expirration time 
        const updatedDetails = await User.findOneAndUpdate(
            {email:email},
            {
                token:token,
                resetPasswordExpires: Date.now() + 3600000,
            },
            {new:true});
        //create url
        const url = `http://localhost:3000/update-password/${token}`;
        // send mail containing url
        await mailSender(email, "Password reset Link",
                        `Password Reset Link ${url} `);
        // return resposne
        return res.json({
            success:true,
            message:'Email sent Successfully, please check email and reset your password',
        }); 
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message: 'Something went wrong while reset password mail',
        });
    }
};

// resetPassword

exports.resetPassword = async (req, res) => {
    try{
                //data fetch 
        const {password, confirmPassword, token} = req.body;

        if(password !== confirmPassword) {
            return res.json({
                success:false,
                message:'Password not matching ',
            });
        }

        const userDetails = await User.findOne({token: token});

        if(!userDetails) {
            return res.json({
                success:false,
                message:'token is invalid',
            });
        }

        if(userDetails.resetPasswordExpires < Date.now() ) {
            return res.json({
                success:false,
                message:'Token is expired, please regenerate your token',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.findOneAndUpdate(
            {token: token},
            {password:hashedPassword},
            {new:true},
        );

        return res.status(200).json({
            success:true,
            message:'Password reset successful'
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Something went wrong while sending reset password mail',
        });
    }
}