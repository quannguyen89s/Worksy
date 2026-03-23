import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();

// Workaround for environments where the system DNS cannot resolve MongoDB SRV records.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

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
