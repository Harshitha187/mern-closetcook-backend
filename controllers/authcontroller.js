import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/usermodels.js';
import transporter from '../config/nodemailer.js';
import dotenv from 'dotenv';
dotenv.config();
export const register=async(req,res)=>{
  const {name,email,password}=req.body;
  try {
    const existingUser = await User.findOne({ email });
    if(!existingUser){
      const hashedpass=await bcrypt.hash(password,10);
      
      // Generate OTP for email verification
      const otp = Math.floor(Math.random() * 900000) + 100000;
      
      const user=new User({
        name,
        email,
        password:hashedpass,
        verifyOtp: otp.toString(),
        verifyOtpExpireAt: Date.now() + 5 * 60 * 1000 // 5 minutes
      });
      await user.save();
      
      const token=jwt.sign({id: user._id},process.env.JWT_SECRET,{expiresIn:'7d'});
      
      // Set cookie with proper settings for development
      const cookieOptions = {
        httpOnly: true,
        maxAge: 7*24*60*60*1000,
        sameSite: 'none',
        secure: process.env.NODE_ENV === 'production'
      };
      res.cookie('token', token, cookieOptions);

      // Send OTP email automatically (async - don't wait)
      const sendEmailAsync = async () => {
        try {
          const mail={
            from:process.env.SMTP_MAIL,
            to:email,
            subject:'Verify Your Email - ClosetCook',
            text:`Hello ${name},\n\nWelcome to ClosetCook! Your email verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nBest regards,\nClosetCook Team`
          };
          
          console.log('Sending registration OTP email to:', email);
          const result = await transporter.sendMail(mail);
          console.log('Registration OTP email sent successfully:', result.messageId);
        } catch (emailError) {
          console.error('Registration email error:', emailError.message);
        }
      };
      
      // Fire and forget - don't wait for email
      sendEmailAsync();

      res.json({success:true, message: "Registration successful! OTP sent to your email."});
    }
    else if(existingUser && !existingUser.isVerified){
      existingUser.name=name;
      const hashedpass=await bcrypt.hash(password,10);
      existingUser.password=hashedpass;
      
      // Generate new OTP for existing unverified user
      const otp = Math.floor(Math.random() * 900000) + 100000;
      existingUser.verifyOtp = otp.toString();
      existingUser.verifyOtpExpireAt = Date.now() + 5 * 60 * 1000;
      
      await existingUser.save();
      
      const token=jwt.sign({id: existingUser._id},process.env.JWT_SECRET,{expiresIn:'7d'});
      
      const cookieOptions = {
        httpOnly: true,
        maxAge: 7*24*60*60*1000,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production'
      };
      res.cookie('token', token, cookieOptions);

      // Send OTP email (async - don't wait)
      const sendEmailAsync = async () => {
        try {
          const mail={
            from:process.env.SMTP_MAIL,
            to:email,
            subject:'Verify Your Email - ClosetCook',
            text:`Hello ${name},\n\nYour new email verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nBest regards,\nClosetCook Team`
          };
          
          console.log('Sending updated registration OTP email to:', email);
          const result = await transporter.sendMail(mail);
          console.log('Updated registration OTP email sent successfully:', result.messageId);
        } catch (emailError) {
          console.error('Updated registration email error:', emailError.message);
        }
      };
      
      // Fire and forget - don't wait for email
      sendEmailAsync();

      return res.json({success:true, message: "Account updated! New OTP sent to your email."});
    }
    else {
      return res.json({
        success: false,
        message: 'User already exists and is verified'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success:false,
      message: 'Registration failed',
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
        message: 'Please verify your email first'
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
    
    const cookieOptions = {
      httpOnly: true,
      maxAge: 7*24*60*60*1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    res.cookie('token', token, cookieOptions);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
}
export const logout = async (req, res) => {
    try {
        const cookieOptions = {
          httpOnly: true,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          secure: process.env.NODE_ENV === 'production'
        };
        res.clearCookie('token', cookieOptions);
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

    // Send OTP email with timeout
    try {
      // Verify transporter is available
      if (!transporter) {
        throw new Error('Email transporter not configured');
      }

      const mail = {
        from: process.env.SMTP_MAIL,
        to: user.email,
        subject: 'Your OTP Code - ClosetCook',
        text: `Hello ${user.name},\n\nYour OTP code is ${otp}. It is valid for 5 minutes.\n\nBest regards,\nClosetCook Team`
      };
      
      console.log('Sending OTP email to:', user.email);
      
      // Add timeout to email sending
      const emailPromise = transporter.sendMail(mail);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email timeout')), 8000)
      );
      
      const result = await Promise.race([emailPromise, timeoutPromise]);
      console.log('OTP email sent successfully:', result.messageId);
    } catch (emailError) {
      console.error('Email error:', emailError.message);
      return res.json({ 
        success: false, 
        message: 'Failed to send OTP email: ' + emailError.message,
        error: emailError.message 
      });
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
    const {email}=req.body;
    if(!email){return res.json({success:false,message:"Email is required"})};
    
    const user=await User.findOne({email});
    if(!user){return res.json({success:false,message:"No user found with this email"})};
    
    const otp=Math.floor(100000+Math.random()*900000);
    const expiry=Date.now()+5*60*1000;
    
    user.resetOtp=otp.toString();
    user.resetOtpExpireAt=expiry;
    await user.save();
    
    // Send email first, then set token and respond
    try {
      const message={
        from: process.env.SMTP_MAIL,
        to: user.email,
        subject: 'Password Reset OTP - ClosetCook',
        text: `Hello ${user.name},\n\nYour password reset OTP is: ${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nClosetCook Team`
      };
      await transporter.sendMail(message);
      console.log('Reset OTP email sent successfully to:', email);
    } catch (emailError) {
      console.error('Error sending reset OTP email:', emailError.message);
      return res.json({success:false,message:"Failed to send OTP email"});
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const cookieOptions = {
      httpOnly: true,
      maxAge: 7*24*60*60*1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production'
    };
    res.cookie('token', token, cookieOptions);
    
    res.json({success:true,message:"Password reset OTP sent to your email"});
  } catch(error) {
    console.error('Reset password error:', error);
    return res.status(500).json({success:false,message:"Failed to process request"});
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

    return res.json({ success: true, message: 'OTP verified successfully. You can now change your password.' });
  } catch (error) {
    console.error('Verify reset error:', error);
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
    
    // Send confirmation email
    try {
      const msg={
        from:process.env.SMTP_MAIL,
        to:user.email,
        subject:'Password Changed Successfully - ClosetCook',
        text:`Hello ${user.name},\n\nYour password has been changed successfully.\n\nIf you didn't make this change, please contact us immediately.\n\nBest regards,\nClosetCook Team`
      };
      await transporter.sendMail(msg);
      console.log('Password change confirmation email sent to:', user.email);
    } catch (emailError) {
      console.error('Error sending password change email:', emailError.message);
      // Continue without failing the response
    }
    
    return res.json({ success: true, message: 'Password changed successfully' });
  }
  catch(error){
    console.error('Change password error:', error);
    res.json({success:false,message:"Failed to change password"});
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
