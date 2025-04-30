const { verifyToken } = require("../controller/auth");
const { markNotificationAsRead } = require("../controller/Notification");
const Notification=require("../model/Notification")
const express=require("express");

const router=express.Router();

router.put("/api/notification/:id/read", verifyToken, markNotificationAsRead);

// On your backend
router.put("/api/notification/markAllAsRead", verifyToken, async (req, res, next) => {
    try {
      const userId = req.user._id;
      
      // For admin, update all notifications; for vendors, only update their own
      const filter = req.user.role === 'admin' ? {} : { user: userId };
      
      // Update all matching notifications to read status
      await Notification.updateMany(filter, { isRead: true });
      console.log("mello")
      res.status(200).json({
        success: true,
        message: "All notifications marked as read"
      });
    } catch (err) {
      next(err);
    }
  });


module.exports=router;