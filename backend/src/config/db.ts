import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const URL = process.env.MONGO_URI || "";

const connectDB = async () => {
  try {
    await mongoose.connect(URL);
    const dbName = mongoose.connection.db?.databaseName ?? "?";
    console.log("Connect database successfully -> database:", dbName);
  } catch (error) {
    console.error("Cannot connect database ", error);
    process.exit(1);
  }
};
export default connectDB;
