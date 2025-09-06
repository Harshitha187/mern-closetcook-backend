import express from "express";
import userAuth from "../middleware/userauth.js";
import { getUserData } from "../controllers/usercontroller.js";
import { analyzeOutfit } from "../controllers/gemini.js";

const userrouter = express.Router();

userrouter.get('/data', userAuth, getUserData);
userrouter.post('/gemini', userAuth, analyzeOutfit);

export default userrouter;
