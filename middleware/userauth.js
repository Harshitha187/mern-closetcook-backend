import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
    const { token } = req.cookies;
    if (!token) return res.json({ success: false,message:"No token found"});

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.id) {
            req.userId = decoded.id;
             // only call next if token is valid
        } else {
            return res.json({ success: false,message:"Invalid token"});
        }
        next();
    } catch (error) {
        return res.json({ success: false, error: error.message });
    }
};

export default userAuth;
