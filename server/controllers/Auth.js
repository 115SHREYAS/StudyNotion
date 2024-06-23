
const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender")
const { passwordUpdated } = require("../mail/templates/passwordUpdate")
const Profile = require("../models/Profile")

require("dotenv").config();
// sendOTP

exports.sendotp = async (req, res) => {
    try {
      const { email } = req.body
  
      // Check if user is already present
      // Find user with provided email
      const checkUserPresent = await User.findOne({ email })
      // to be used in case of signup
  
      // If user found with provided email
      if (checkUserPresent) {
        // Return 401 Unauthorized status code with error message
        return res.status(401).json({
          success: false,
          message: `User is Already Registered`,
        })
      }
  
      var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      })
      const result = await OTP.findOne({ otp: otp })
      console.log("Result is Generate OTP Func")
      console.log("OTP", otp)
      console.log("Result", result)
      while (result) {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
        })
      }
      const otpPayload = { email, otp }
      const otpBody = await OTP.create(otpPayload)
      console.log("OTP Body", otpBody)
      res.status(200).json({
        success: true,
        message: `OTP Sent Successfully`,
        otp,
      })
    } catch (error) {
      console.log(error.message)
      return res.status(500).json({ success: false, error: error.message })
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
        
        // find the most recent otp
        const recentOtp = await OTP.find({email}).sort({createdAt:-1}).limit(1);
        console.log(recentOtp);
    
        if(recentOtp.length == 0) {
            return res.status(400).json({
                success:false,
                message:"The otp is not valid",
            })
        } else if(otp !== recentOtp) {
            return res.status(400).json({
                success:false,
                message:"The otp is not valid ",
            });
        }
    
        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);
    
        // create user 
        // let approved = ""
        // approved === "Instructor" ? (approved = false) : (approved = true)
    
        // create additional profile for user 
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
            error: error.message,
        });
    }
} 

// ChangePassword

exports.changePassword = async (req, res) => {
    try {
      // Get user data from req.user
      const userDetails = await User.findById(req.user.id)
  
      // Get old password, new password, and confirm new password from req.body
      const { oldPassword, newPassword } = req.body
  
      // Validate old password
      const isPasswordMatch = await bcrypt.compare(
        oldPassword,
        userDetails.password
      )
      if (!isPasswordMatch) {
        // If old password does not match, return a 401 (Unauthorized) error
        return res
          .status(401)
          .json({ success: false, message: "The password is incorrect" })
      }
  
      // Update password
      const encryptedPassword = await bcrypt.hash(newPassword, 10)
      const updatedUserDetails = await User.findByIdAndUpdate(
        req.user.id,
        { password: encryptedPassword },
        { new: true }
      )
  
      // Send notification email
      try {
        const emailResponse = await mailSender(
          updatedUserDetails.email,
          "Password for your account has been updated",
          passwordUpdated(
            updatedUserDetails.email,
            `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
          )
        )
        console.log("Email sent successfully:", emailResponse.response)
      } catch (error) {
        // If there's an error sending the email, log the error and return a 500 (Internal Server Error) error
        console.error("Error occurred while sending email:", error)
        return res.status(500).json({
          success: false,
          message: "Error occurred while sending email",
          error: error.message,
        })
      }
  
      // Return success response
      return res
        .status(200)
        .json({ success: true, message: "Password updated successfully" })
    } catch (error) {
      // If there's an error updating the password, log the error and return a 500 (Internal Server Error) error
      console.error("Error occurred while updating password:", error)
      return res.status(500).json({
        success: false,
        message: "Error occurred while updating password",
        error: error.message,
      })
    }
}
