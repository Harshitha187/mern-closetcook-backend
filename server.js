import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authrouter from "./routes/authroutes.js";
import userrouter from "./routes/userRoutes.js";
const app = express();
const port = process.env.PORT || 4000;
connectDB();
app.use(express.json());
app.use(cookieParser());
const allowedOrigins=['https://closetcook.vercel.app']
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use("/api/auth", authrouter);
app.use("/api/user", userrouter);
app.get("/", (req, res) => {
  res.send("gay mf");
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
export default app;
