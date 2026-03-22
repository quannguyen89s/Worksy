import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.MONGO_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(URL);
    console.log("Connect database succesfully");
  } catch (error) {
    console.error("Cannot connect database ", error);
    process.exit(1);
  }
};
export default connectDB;
