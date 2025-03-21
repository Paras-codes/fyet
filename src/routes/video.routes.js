import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, publishAVideo } from "../controllers/video.controller.js";

const router=Router()

router.route("/publishvideo").post(
    verifyJWT,
    publishAVideo)
router.route("/getallvideos").get(
    verifyJWT,getAllVideos)
    
    export default router;