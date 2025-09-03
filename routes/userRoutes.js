import express from "express";
import userAuth from "../middleware/userauth.js";
import { getUserData } from "../controllers/usercontroller.js";

const userrouter = express.Router();

userrouter.get('/data', userAuth, getUserData);

export default userrouter;
