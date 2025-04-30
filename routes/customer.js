
const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin, isActiveUser } = require("../middleware/checkingRole")
const { verifyToken } = require("../controller/auth")
const router = express.Router();
const {
    getCustomerApprovedRentals,
    getCustomerRejectedRentals,
    getCustomerPendingRentals,
    getCustomerInTripRentals,
    getCustomerCompletedRentals,
    getCustomerCancelledRentals,
    getCustomerRentalDetails
} = require("../controller/customer")



router.post("/api/customer/rental", verifyToken, isCustomer, getCustomerRentalDetails)


module.exports=router;
