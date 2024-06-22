const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// create Subsection

exports.createSubSection = async (req, res) => {
    try{
        // data fetch
        const {SectionId, title, timeDuration, description} = req.body;

        // extract file video
        const video = req.files.videoFile;

        // validation
        if(!SectionId || !title || !timeDuration || !description || !video) {
            return res.status(400).json({
                success:false,
                message:'All fields are required',
            });
        }
        // upload video to cloudinary
        const uploadDetails = await uploadImageToCloudinary(video, process.env.FOLDER_NAME);


        // create a subSection
        const subSectionDetails = await SubSection.create({
            title:title,
            timeDuration:timeDuration,
            description:description,
            videoUrl:uploadDetails.secure_url,
        })

        // update section with this subsection
        const updatedSection = await Section.findByIdAndUpdate({_id:sectionId},
                                                    {$push:{
                                                        subSection:subSectionDetails._id,
                                                    }},
                                                    {new:true});
        // return res
        return res.status(200).json({
            success:true,
            message:'Sub Section Created Successfully',
            updatedSection,
        });
        
    }
    catch(error) {
        return res.status(500).json({
            success:false,
            message:"Internal server error",
            error:error.message,
        })
    }
};

// update Subsection

// delete Subsection