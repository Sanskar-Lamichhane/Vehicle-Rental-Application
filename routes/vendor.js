
const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin, isActiveUser } = require("../middleware/checkingRole")
const { verifyToken } = require("../controller/auth")
const router = express.Router();
const {
    getVendorPendingRentals,
    getVendorCancelledRentals,
    getVendorApprovedRentals,
    getVendorRejectedRentals,
    getVendorInTripRentals,
    getVendorCompletedRentals,
    getAllVendorVehicles,
    getAllVendorRentals,
    getVendorDashboardSummary
} = require("../controller/vendor");
const { getVendorNotifications } = require("../controller/Notification");


router.get("/api/vendor/vehicles", verifyToken, isVendor, getAllVendorVehicles)
router.post("/api/vendor/rentalList", verifyToken, isVendor, getAllVendorRentals)
router.get("/api/vendor/summaryList",verifyToken, isVendor, getVendorDashboardSummary);
router.get("/api/vendor/getVendorNotification",verifyToken, isVendor, getVendorNotifications)

module.exports=router;
