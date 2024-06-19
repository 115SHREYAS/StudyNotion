
const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

require("dotenv").config();
// sendOTP

exports.sendOTP = async (req, res) => {

    // fetch email from body 
    try{
        const {email} = req.body;

        const checkUserPresent = await User.findOne({email});

        if(checkUserPresent) {
            return res.status(401).json({
                success: false,
                message:'User already registered'
            })
        }

        // generate otp
        var otp = otpGenerator.generate(6, {
            upperCaseAlphabets:false,
            lowerCaseAlphabets:false,
            specialChars:false,
        });
        console.log("OTP generator : ", otp);

        // check unique otp or not 
        let result = await OTP.findOne({otp: otp});

        while(result) {
            otp = otpGenerator(6, {
                upperCaseAlphabets:false,
                lowerCaseAlphabets:false,
                specialChars:false,
            });

            result = await OTP.findOne({otp: otp});
        }

        const otpPayload = {email, otp};

        // create an entry in db for otp

        const otpBody = await OTP.create(otpPayload);
        console.log(otpBody);

        res.status(200).json({
            success:true,
            message:'Otp sent successfully',
            otp,
        })
    }
    catch(error) {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
    
}


// signup 

exports.signUp = async (req, res) => {

    try{
        // data fetch from body of signup
        const {
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            accountType,
            contactNumber,
            otp
        } = req.body;
    
        // validation
        if(!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success:false,
                message:"All fields are required",
            })
        }
    
        if(password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message:'Password and confirmPassword values does not match',
            });
        }
    
        const existingUser = await User.findOne({email});
    
        if(existingUser) {
            return res.status(400).json({
                success:false,
                message:'User already exists',
            });
        }
    
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
    
        if(recentOtp.length == 0) {
            return res.status(400).json({
                success:false,
                message:'Otp found',
            })
        } else if(otp !== recentOtp) {
            return res.status(400).json({
                success:false,
                message:'Invalid OTP',
            });
        }
    
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
    
    
        const profileDetails = await Profile.create({
            gender:null,
            dateOfBirth:null,
            about:null,
            contactNumber:null,
        });
    
        const user = await User.create({
            firstName,
            lastName,
            email,
            contactNumber,
            password:hashedPassword,
            accountType,
            additionalDetails:profileDetails._id,
            image:`https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
        })

        // return res
        return res.status(200).json({
            success:true,
            message:'User registered successfully',
            user,
        });
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:"User cannot be registered. please try again",
        })
    }
    

}




// login

exports.login = async (req, res) => {
    try{
        // get data 
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(403).json({
                success:false,
                message:'Enter all the details and try again'
            });
        }

        const user = await User.findOne({email}).populate("additionalDetails");
        if(!user) {
            return res.status(401).json({
                success:false,
                message:"User is not registered, please signup first",
            });
        }
        //generate jwt after password matching 
        if(await bcrypt.compare(password, user.password)) {

            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType,
            }

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn:"2h",
            });
            user.token = token;
            user.password = undefined;

            // create cookie
            const options = {
                expires: new Date(Date.now() + 3*34*60*60*1000),
                httpOnly: true,
            }
            res.cookie("token", token, options).status(200).json({
                success:true,
                token,
                user, 
                message:'Logged in successfully',
            })

        }
        else {
            return res.status(401).json({
                success:false,
                message:'Password is incorrect',
            });
        }
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success:false,
            message:'Login failure, please try again ',
        });
    }
} 

// ChangePassword

exports.changePassword = async (req, res) => {

}
