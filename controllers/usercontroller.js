import User from "../models/usermodels.js";

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
        isAccountVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error("Error in getUserData:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
