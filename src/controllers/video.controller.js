import mongoose, {Types, isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, thumbnailLink,videolink} = req.body
    const id=req.user?._id;
    const role=req.user?.role;
    console.log({title,thumbnailLink,videolink});
    
   
    if(!id){
        throw new ApiError(404,"userid is required")
    }

    if(!isValidObjectId(id)){
        throw new ApiError(404,"Invalid channel")
    }
    const user=await User.findById(id);
    if(!user){
        throw new ApiError(404,"User not found")
    }
    
    // const user_id=new mongoose.Types.ObjectId(id);

    // const thumbnailLocalPath=req.files?.thumbnail[0]?.path;
    // if(!thumbnailLocalPath){
    //     throw new ApiError(404,"thumbnail is required")
    // }
    // const videoLocalPath=req.files?.video[0]?.path;
    // if(!videoLocalPath){
    //     throw new ApiError(404,"video is required")
    // }

    // const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);
    // if(!thumbnail){
    //     throw new ApiError(404,"thumbnail not uploaded try again")
    // }
    
  
    
    const video_doc=await Video.create({
        videoFile:videolink,
        thumbnail:thumbnailLink,
        title:title,
 })

 const video_check=await Video.findById(video_doc._id)

 if(!video_check){
    throw new ApiError(404,"Something went wrong try again")
    }

 return res.status(200)
 .json(
    new ApiResponse( 200,
        video_doc,
        "video published sucessfully ")
        )   
})


const getAllVideos = asyncHandler(async (req, res) => {
    const id=req.user?._id;
    if(!id){
        throw new ApiError(404,"userid is required")
    }

    if(!isValidObjectId(id)){
        throw new ApiError(404,"Invalid channel")
    }
    const user=await User.findById(id);
    if(!user){
        throw new ApiError(404,"User not found")
    }
    const videos = await Video.find({}).sort({createdAt: -1})
    return res.status(200).json(new ApiResponse(200, videos, "All videos fetched successfully"))
})
export {
    getAllVideos,
    publishAVideo
}