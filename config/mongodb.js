import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" }); // adjust path if needed
const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/fullstack`);
    console.log("MongoDB connected...");
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;
