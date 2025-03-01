

const jwt = require("jsonwebtoken");




// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token
    if (!token) {
        return res.status(401).send({ message: "Authentication token is required." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach decoded user info to request object

        next();
    } catch (err) {
        res.status(403).send({ message: "Invalid or expired token." });
    }
};


module.exports={verifyToken}