import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token, unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id)
      .select("-password")
      .populate("allowedDimensions", "name detail");

    if (!req.user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!req.user.isActive) {
      return res.status(403).json({ error: "Account has been deactivated" });
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalid or expired" });
  }
};

// Role-based access control
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // superAdmin bypasses all role checks
    if (req.user.role === "superAdmin") return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Account-role-based access control
export const requireAccountRole = (...accountRoles) => {
  return (req, res, next) => {
    // superAdmin bypasses all accountRole checks
    if (req.user.accountRole === "superAdmin") return next();
    if (!accountRoles.includes(req.user.accountRole)) {
      return res.status(403).json({ error: "Insufficient account permissions" });
    }
    next();
  };
};
