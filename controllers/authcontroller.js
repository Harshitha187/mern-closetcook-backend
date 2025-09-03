import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/usermodels.js';
import transporter from '../config/nodemailer.js';
export const register=async(req,res)=>{
  const {name,email,password}=req.body;
  try {
    const existingUser = await User.findOne({ email });
    if(!existingUser){
    const hashedpass=await bcrypt.hash(password,10);
    const user=new User({name,email,password:hashedpass});
    await user.save();
    const token=jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
    res.cookie('token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'strict',maxAge:7*24*60*60*1000});
   const mail={
    from:process.env.SMTP_MAIL,
    to:email,
    subject:'Welcome to Our Service',
    text:`Hello ${name},\n\nThank you for registering you bitch! I hacked you`
   }
   await transporter.sendMail(mail);
    res.json({success:true});
  }
  else if(existingUser && !existingUser.isVerified){
    existingUser.name=name;
    const hashedpass=await bcrypt.hash(password,10);
    existingUser.password=hashedpass;
    await existingUser.save();
    const token=jwt.sign({id: existingUser._id},process.env.JWT_SECRET,{expiresIn:'7d'});
    res.cookie('token',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'strict',maxAge:7*24*60*60*1000});
    return res.json({success:true});
  }
     else {
      return res.json({
        success: false,
        message: 'User already exists'
      });
    }
  } catch (error) {
    res.status(500).json({
      success:false,
      error:error.message
    });
  }
}
export const login=async(req,res)=>{
  const {email,password}=req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    if(!user.isVerified) {
      return res.json({
        success: false,
        message: 'Email not verified'
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
export const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        });
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
export const verifyotp = async (req, res) => {
  try {
    const userId  = req.userId;

    if (!userId) return res.status(400).json({ success: false, message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.json({ success: false, message: 'User not found' });

    if (user.isVerified) return res.json({ success: false, message: 'OTP already verified' });

    const otp = Math.floor(Math.random() * 900000) + 100000;

    user.verifyOtp = otp.toString();
    user.verifyOtpExpireAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send OTP email
    try {
      const mail = {
        from: process.env.SMTP_MAIL,
        to: user.email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It is valid for 5 minutes.`
      };
      await transporter.sendMail(mail);
    } catch (emailError) {
      console.error('Error sending OTP email:', emailError.message);
      // Continue without failing the response
    }

    return res.json({ success: true, message: "OTP sent to your email" });
  } catch (error) {
    return res.json({ success: false, error: error.message });
  }
};
export const verifyEmail = async (req, res) => {
  try {
    const userId = req.userId;
    const { otp } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'User ID missing' });
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isVerified) return res.json({ success: false, message: 'OTP already verified' });

    if (user.verifyOtp !== otp.toString()) return res.json({ success: false, message: 'Invalid OTP' });

    if (user.verifyOtpExpireAt < Date.now()) return res.json({ success: false, message: 'OTP expired' });

    user.isVerified = true;         // mark user as verified
    user.verifyOtp = '';            // clear OTP
    user.verifyOtpExpireAt = 0;     // clear expiry
    await user.save();

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const resetpass=async(req,res)=>{
  try{
  const userId=req.userId;
  if(!userId){return res.json({success:false,message:"User ID is required"})};
  const user=await User.findById(userId);
  if(!user){return res.json({success:false,message:"No user found"})};
  const otp=Math.floor(100000+Math.random()*900000);
  const expiry=Date.now()+5*60*1000;
  user.resetOtp=otp.toString();
  user.resetExpireAt=expiry;
  await user.save();
  const message={
    from: process.env.SMTP_MAIL,
    to: user.email,
    subject: 'Your password reset OTP',
    text: `Your password reset OTP code is ${otp}. It is valid for 5 minutes.`
  };
  res.json({success:true,message:"OTP sent successfully"});
  await transporter.sendMail(message);
  } catch(error) {
    return res.status(500).json({success:false,message:error.message});
  }
};
export const verifyreset = async (req, res) => {
  try {
    const userId = req.userId;
    const { otp } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: 'User ID missing' });
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.resetOtp !== otp.toString()) return res.json({ success: false, message: 'Invalid OTP' });

    if (user.resetOtpExpireAt < Date.now()) return res.json({ success: false, message: 'OTP expired' });
    user.resetOtp = '';            // clear OTP
    user.resetOtpExpireAt = 0;     // clear expiry
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const changepass=async(req,res)=>{
  try{
    const{newpass}=req.body;
  const userId=req.userId;

  if(!userId) return res.status(400).json({ success: false, message: 'User ID missing' });
  if(!newpass) return res.status(400).json({ success: false, message: 'New password is required' });

  const user=await User.findById(userId);
  if(!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.password=await bcrypt.hash(newpass, 10);
  await user.save();
  const msg={
    from:process.env.SMTP_MAIL,
    to:user.email,
    subject:'Password Changed Successfully',
    text:'Noob forgot password'
  }
  await transporter.sendMail(msg);
  return res.json({ success: true, message: 'Password changed successfully' });
  }
  catch(error){
    res.json({success:false,message:error.message});
  }
};
export const isAuthenticated=async(req,res)=>{
try{
return res.json({success:true,message:"User is authenticated"})
}
catch(error){
  return res.json({success:false,message:error.message})
}
};