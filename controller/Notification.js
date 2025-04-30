// const Notification = require("../model/Notification");
// const User = require("../model/User");

// // Fetch notifications for the logged-in vendor
// const getVendorNotifications = async (req, res, next) => {
//   try {
//     // Get the current vendor's ID from the authenticated user
//     const vendorId = req.user._id;
    
//     // Check if the user is a vendor
//     if (req.user.role !== 'vendor') {
//       return res.status(403).json({ message: "Access denied. Only vendors can access this resource." });
//     }
    
//     // Get pagination parameters from query with defaults
//     const per_page = parseInt(req.query.per_page) || 10;
//     const page = parseInt(req.query.page) || 1;
//     const skip = (page - 1) * per_page;
    
//     // Fetch notifications for this vendor with pagination
//     // Sort by createdAt in descending order (newest first)
//     const notifications = await Notification.find({ user: vendorId })
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(per_page);
    
//     // Get total count for pagination
//     const totalCount = await Notification.countDocuments({ user: vendorId });
    
//     return res.status(200).json({
//       success: true,
//       meta_data: {
//         count: notifications.length,
//         total: totalCount,
//         total_pages: Math.ceil(totalCount / per_page),
//         current_page: page,
//         per_page: per_page
//       },
//       data: notifications
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Fetch all notifications (admin only)
// const getAllNotifications = async (req, res, next) => {
//   try {
//     // Check if the user is an admin
//     if (req.user.role !== 'admin') {
//       return res.status(403).json({ message: "Access denied. Only admins can access this resource." });
//     }
    
//     // Get pagination parameters from query with defaults
//     const per_page = parseInt(req.query.per_page) || 10;
//     const page = parseInt(req.query.page) || 1;
//     const skip = (page - 1) * per_page;
    
//     // Fetch all notifications with pagination
//     // Populate the user field to get vendor details
//     const notifications = await Notification.find({})
//       .populate('user', 'name email phone role') // Populate user details
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(per_page);
    
//     // Get total count for pagination
//     const totalCount = await Notification.countDocuments({});
    
//     return res.status(200).json({
//       success: true,
//       meta_data: {
//         count: notifications.length,
//         total: totalCount,
//         total_pages: Math.ceil(totalCount / per_page),
//         current_page: page,
//         per_page: per_page
//       },
//       data: notifications
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Alternative implementation using aggregate (if you need more complex operations)
// const getVendorNotificationsAggregate = async (req, res, next) => {
//   try {
//     const vendorId = req.user._id;
    
//     if (req.user.role !== 'vendor') {
//       return res.status(403).json({ message: "Access denied. Only vendors can access this resource." });
//     }
    
//     const per_page = parseInt(req.query.per_page) || 10;
//     const page = parseInt(req.query.page) || 1;
    
//     const result = await Notification.aggregate([
//       // Match notifications for this vendor
//       { $match: { user: vendorId } },
//       // Facet allows us to do the count and data fetch in one operation
//       { $facet: {
//         metadata: [
//           { $count: 'totalCount' }
//         ],
//         data: [
//           { $sort: { createdAt: -1 } },
//           { $skip: (page - 1) * per_page },
//           { $limit: per_page }
//         ]
//       }}
//     ]);
    
//     const totalCount = result[0].metadata[0]?.totalCount || 0;
//     const notifications = result[0].data;
    
//     return res.status(200).json({
//       success: true,
//       meta_data: {
//         count: notifications.length,
//         total: totalCount,
//         total_pages: Math.ceil(totalCount / per_page),
//         current_page: page,
//         per_page: per_page
//       },
//       data: notifications
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// module.exports = {
//   getVendorNotifications,
//   getAllNotifications,
//   getVendorNotificationsAggregate
// };


const Notification = require("../model/Notification");
const User = require("../model/User");

// Fetch notifications for the logged-in vendor
const getVendorNotifications = async (req, res, next) => {
  try {
    // Get the current vendor's ID from the authenticated user
    const vendorId = req.user._id;
    
    // Check if the user is a vendor
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: "Access denied. Only vendors can access this resource." });
    }
    
    // Get pagination parameters from query with defaults
    const per_page = parseInt(req.query.per_page) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * per_page;
    const sort_dir = req.query.sort_dir === 'asc' ? 1 : -1;
    
    // Fetch notifications for this vendor with pagination
    // Sort by createdAt in descending order (newest first) by default
    const notifications = await Notification.find({ user: vendorId })
      .sort({ createdAt: sort_dir })
      .skip(skip)
      .limit(per_page);
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments({ user: vendorId });
    
    return res.status(200).json({
      success: true,
      meta_data: {
        count: notifications.length,
        total: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page: per_page,
        sort_direction: sort_dir === 1 ? 'asc' : 'desc'
      },
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

// Fetch all notifications (admin only)
const getAllNotifications = async (req, res, next) => {
  try {
    // Check if the user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Only admins can access this resource." });
    }
    
    // Get pagination parameters from query with defaults
    const per_page = parseInt(req.query.per_page) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * per_page;
    const sort_dir = req.query.sort_dir === 'asc' ? 1 : -1;
    
    // Fetch all notifications with pagination
    // Populate the user field to get vendor details
    const notifications = await Notification.find({})
      .populate('user', 'name email phone role') // Populate user details
      .sort({ createdAt: sort_dir })
      .skip(skip)
      .limit(per_page);
    
    // Get total count for pagination
    const totalCount = await Notification.countDocuments({});
    
    return res.status(200).json({
      success: true,
      meta_data: {
        count: notifications.length,
        total: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page: per_page,
        sort_direction: sort_dir === 1 ? 'asc' : 'desc'
      },
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};



// Function to toggle a notification's read status
const markNotificationAsRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    
    // Find the notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    // Verify ownership or admin rights
    if (req.user.role !== 'admin' && notification.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only modify your own notifications."
      });
    }
    
    // Toggle the notification's read status
    notification.isRead = !notification.isRead;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: `Notification marked as ${notification.isRead ? 'read' : 'unread'}`,
      data: notification
    });
  } catch (err) {
    next(err);
  }
};

// Alternative implementation using aggregate (if you need more complex operations)
const getVendorNotificationsAggregate = async (req, res, next) => {
  try {
    const vendorId = req.user._id;
    
    if (req.user.role !== 'vendor') {
      return res.status(403).json({ message: "Access denied. Only vendors can access this resource." });
    }
    
    const per_page = parseInt(req.query.per_page) || 10;
    const page = parseInt(req.query.page) || 1;
    const sort_dir = req.query.sort_dir === 'asc' ? 1 : -1;
    
    const result = await Notification.aggregate([
      // Match notifications for this vendor
      { $match: { user: vendorId } },
      // Facet allows us to do the count and data fetch in one operation
      { $facet: {
        metadata: [
          { $count: 'totalCount' }
        ],
        data: [
          { $sort: { createdAt: sort_dir } },
          { $skip: (page - 1) * per_page },
          { $limit: per_page }
        ]
      }}
    ]);
    
    const totalCount = result[0].metadata[0]?.totalCount || 0;
    const notifications = result[0].data;
    
    return res.status(200).json({
      success: true,
      meta_data: {
        count: notifications.length,
        total: totalCount,
        total_pages: Math.ceil(totalCount / per_page),
        current_page: page,
        per_page: per_page,
        sort_direction: sort_dir === 1 ? 'asc' : 'desc'
      },
      data: notifications
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getVendorNotifications,
  getAllNotifications,
  getVendorNotificationsAggregate,
  markNotificationAsRead  // Export the new function
};