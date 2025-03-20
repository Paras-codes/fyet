import mongoose from "mongoose";
import {DB_NAME} from "../constant.js";
// import { config } from "dotenv";
// config();

const database=async()=>{
    try {
        const connection=await mongoose.connect(`${process.env.MongoDB_URI}/${DB_NAME}`);

        console.log(`database connected to host:${connection.connections[0].host}`);

    } catch (error) {
        console.log("mongoDb connection error",error);
        process.exit(1)
    }
}

export default database;