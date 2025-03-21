import cors from "cors"
import cookieParser from "cookie-parser";
import express from "express"
import bodyParser from 'body-parser';

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))//to store general assets(pdf,images,favicon) in public folder

app.use(cookieParser())//in order to peform actions on cookie  
app.use(bodyParser.urlencoded({ extended: true }));

// Parse application/json
app.use(bodyParser.json());
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js"
app.use("/api/v1/video",videoRoutes)
app.use("/api/v1/user",userRoutes)
export{app}