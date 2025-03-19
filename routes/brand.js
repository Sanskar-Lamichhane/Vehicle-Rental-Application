const express = require("express")
const { isVendor, isSpecificVendor, isCustomer, isAuthorizeVendor, isAdmin } = require("../middleware/checkingRole")
const { verifyToken } = require("../controller/auth")
const router = express.Router();

const {createBrand, updateBrand, fetchBrands}=require("../controller/brand")

router.post("/api/brand",verifyToken, isAdmin, createBrand)

router.put("/api/brand/:id", verifyToken, isAdmin, updateBrand)

router.get("/api/brand", fetchBrands )

module.exports=router;