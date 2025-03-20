import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })//jisse ki save hone se phle checkk na kre aur na password ko phir se hash kare 

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    //frontend se lelo 
    //validation check karlo 
    //validation of files upload 
    //no avatar te error else not needed coverimage
    //find if user exists with that username and email or not 
    //upload on cloudinary 
    //check karo ki upload hua bhi h cloudinary p ya nii
    //no avatar throw error
    //use save in db aur response m user bina password k bhejdo   
    
    const {fullName,email,age,username,password,role}=req.body;
    if(
        [fullName,email,age,username,password,role].some((fields)=>
            fields?.trim()==="")
    ){

    throw new ApiError(400,"All fields are required");

    }

    console.log({fullName,email,username,password});

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
     console.log(existedUser);
    if(existedUser){
        throw new ApiError(409,"User with this email or username already exists")
    }

    console.log(req.files);
     
    const avatarLocalPath=req.files?.avatar[0]?.path;
    let coverImagePath;
    // let coverImageLocalPath;
    // if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    //     coverImageLocalPath = req.files.coverImage[0].path
    // }
    

    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);
    // const coverImage=await uploadOnCloudinary(coverImagePath);
    if(!avatar){
        throw new ApiError(400,"avatar file is not uploaded");
    }

    const user = await User.create({
        fullName:fullName,
        avatar: avatar.url,
        age,
        role,
        email, 
        password,
        username,

    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser=asyncHandler(async(req,res)=>{
      // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log({email,username,password});

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)//very important take care that you are calling a function with the reference of founded user not User model 

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")//it is a costlier process though we can use a traditional method to  manuplate the values

    const options = {
        httpOnly: true,
        secure: true
    }//these option enables the security of cookies so that they cant get modified fron frontend 

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)//key ,value ,options 
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    //new password,old password
    //get the user from auth middleware ,req.user?._id 
    //check user.ispassword
    //if yes than update new password 
    const {oldPassword,newPassword}=req.body;


    if(!oldPassword||!newPassword){
         throw new ApiError(400,"Enter old and new password");
    } 
      console.log({oldPassword,newPassword});
    const user=await User.findById(req.user?._id).select('-refreshToken');
     
    if(!user){
        throw new ApiError(404,"Unauthourized acess");
    }

    const PasswordCorrect=await user.isPasswordCorrect(oldPassword);
    if(!PasswordCorrect){
        throw new ApiError(404,"Password does'nt match")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave:false});
     
    return res.status(200).json(new ApiResponse(200,{},"Password changed sucessfully"));

})

const getCurrentUser=asyncHandler(async(req,res)=>{
    

    return res.status(200)
    .json(new ApiResponse(200,req.user,"user fetched sucessfully"))
})
//always keep file updation seperately 
const updateAccountDetails=asyncHandler(async(req,res)=>{
    //always keep file updation process seperate from main stream data updation why to update whole for a small thing so removing repetative request of saving data

    //algo

    //take the details to update 
    //take the reference of the user 
    //inject them into the object 
    //save the object 

    const  {fullName, email}=req.body ;

    const user=await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                    fullName,
                    email
            },
            
    },
    {new:true}//it will return the updated user
    )
    .select('-password -refreshToken');

    // if(!user){
    //     throw new ApiError(404,"Unauthourized acess");
    // }

    // user.fullName=fullName;
    // user.username=username;

    // user.save({validateBeforeSave:false});

    return res.status(200)
    .json(new ApiResponse(200,user,"user updated sucessfully"));
})


const updateUseravatar=asyncHandler(async(req,res)=>{
    console.log(req.file);
    console.log(req.user);
    const avatarLocalPath=req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"cloudinaryAvatar file is missing");
    }
     
    const user =await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },{
            new:true 
        })
        .select("-password -refreshToken")

        console.log(user);

        return res.status(200)
        .json(new ApiResponse(200,user,"avatar updagted sucessfully"));

})

// const getUserChannelProfile=asyncHandler(async(req,res)=>{
//     const {username}=req.params;

//     const channel=await User.aggregate([
//         {
//             $match:{
//                 username:username?.toLowerCase()
//             }
//         },
//         {
//             $lookup:{
//                 from: "subscriptions", // The collection to join with
//                 localField: "_id", // Field from the current collection (User) to match
//                 foreignField: "channel", // Field from the 'subscriptions' collection to match
//                 as: "subscribers"//alias name to store the result
//             }
//         },
//         {
//             $lookup: {
//                 from: "subscriptions",
//                 localField: "_id",
//                 foreignField: "subscriber",
//                 as: "subscribedTo"
//             }
//         },
//         {
//             $addFields: {
//                 subcribersCount: {
//                     $size: "$subscribers"
//                 },
//                 channelsSubscribedToCount: {
//                     $size: "$subscribedTo"
//                 },
//                 isSubscribed: {
//                     $cond: {
//                         //"$subscribers.subscriber" is pointing subscriber field in subscribers collection
//                         if: {$in: [req.user?._id, "$subscribers.subscriber"]},//in operator can find if the particular entry is present in the array ,object or not 
//                         then: true,
//                         else: false
//                     }
//                 }
//             }
//         },
//         {
//             $project: {
//                 fullName: 1,
//                 username: 1,
//                 email: 1,
//                 avatar: 1,
//                 coverImage: 1,
//                 subcribersCount: 1,
//                 channelsSubscribedToCount: 1,
//                 isSubscribed: 1
//             }
//         }
//     ])

//     if (!channel?.length) {
//         throw new ApiError(404, "channel doesnot exist");
//     }
//     console.log(channel[0]);
//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 channel[0],
//                 "User channel fetced successfully"
//             )
//         )
// })
// const getWatchHistory = asyncHandler(async(req, res) => {
//     const user = await User.aggregate([
//         {
//             $match: {
//                 _id: new mongoose.Types.ObjectId(req.user?._id)
//             }
//         },
//         {
//             $lookup: {
//                 from: "videos",
//                 localField: "watchHistory",
//                 foreignField: "_id",
//                 as: "watchHistory",
//                 pipeline: [
//                     {
//                         $lookup: {
//                             from: "users",
//                             localField: "owner",
//                             foreignField: "_id",
//                             as: "owner",
//                             pipeline: [
//                                 {
//                                     $project: {
//                                         username: 1,
//                                         fullName: 1,
//                                         avatar: 1
//                                     }
//                                 }
//                             ]
//                         }
//                     },
//                     {
//                         $addFields: {
//                             owner: {
//                                 $first: "$owner"
//                             }
//                         }
//                     }
//                 ]
//             }
//         }
//     ]);

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(
//                 200,
//                 user[0].watchHistory,
//                 "Watch history fetched successfully"
//             )
//         )
// });
export{
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUseravatar,
    // getUserChannelProfile,
    // getWatchHistory    
}
