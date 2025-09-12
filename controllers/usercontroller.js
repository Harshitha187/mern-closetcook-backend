import User from "../models/usermodels.js";
import cloudinary from "../config/cloudinary.js";

export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user ID provided" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "No user found" });
    }

    res.status(200).json({
      success: true,
      userData: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        website: user.website,
        stylePreferences: user.stylePreferences,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        postCount: user.postCount,
        isAccountVerified: user.isAccountVerified
      }
    });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.body.userId;
    const { name, bio, location, website, stylePreferences } = req.body;

    let updateData = {
      name,
      bio,
      location,
      website,
      stylePreferences: stylePreferences ? stylePreferences.split(',').map(pref => pref.trim()) : []
    };

    // Handle profile picture upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'closetcook/profiles',
          resource_type: 'image',
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' }
          ]
        });
        updateData.profilePicture = result.secure_url;
      } catch (uploadError) {
        console.error('Image upload error:', uploadError);
        return res.json({ success: false, message: 'Error uploading profile picture' });
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      userData: {
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        website: user.website,
        stylePreferences: user.stylePreferences,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        postCount: user.postCount,
        isAccountVerified: user.isAccountVerified
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.json({ success: false, message: 'Error updating profile' });
  }
};

// Get user profile by ID
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetExpireAt');

    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      userData: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        location: user.location,
        website: user.website,
        stylePreferences: user.stylePreferences,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        postCount: user.postCount,
        isAccountVerified: user.isAccountVerified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.json({ success: false, message: 'Error fetching user profile' });
  }
};
