import express from "express";
import userAuth from "../middleware/userauth.js";
import { uploadSingle, handleUploadError } from "../middleware/upload.js";
import { getUserData, updateProfile, getUserProfile } from "../controllers/usercontroller.js";
import { analyzeOutfit } from "../controllers/gemini.js";

const userrouter = express.Router();

userrouter.get('/data', userAuth, getUserData);
userrouter.post('/gemini', userAuth, analyzeOutfit);
userrouter.put('/profile', userAuth, uploadSingle, handleUploadError, updateProfile);
userrouter.get('/profile/:userId', userAuth, getUserProfile);

export default userrouter;
