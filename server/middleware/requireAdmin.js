const Admin = require("../models/Admin");

const requireRole = (role) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} access required` });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: `Unable to verify ${role} access` });
  }
};

const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (!req.user._id || !(await Admin.exists({ _id: req.user._id }))) {
      return res.status(403).json({ message: "Admin access required" });
    }

    return next();
  } catch (err) {
    return res.status(500).json({ message: "Unable to verify admin access" });
  }
};

module.exports = requireAdmin;
module.exports.requireRole = requireRole;
