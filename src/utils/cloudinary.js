import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
import {config} from  "dotenv";
import { ApiError } from "./ApiError.js";
config();


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
function getPublicId(url) {
    let urlParts = url.split('/');
    let publicIdWithExtension = urlParts[urlParts.length - 1];
    let publicId = publicIdWithExtension.split('.')[0];
    return publicId;
}
const deleteFromCloudinary= async(oldUrl)=>{
    let publicId = getPublicId(oldUrl);
   
    try {
        let result = await new Promise((resolve, reject) => {
            cloudinary.uploader.destroy(publicId, function(error, result) {
                if (error) reject(error);
                else resolve(result);
            });
        });

        return result;
    } catch (error) {
        return error;
    }
   
}


export {
    uploadOnCloudinary,
    deleteFromCloudinary

        }