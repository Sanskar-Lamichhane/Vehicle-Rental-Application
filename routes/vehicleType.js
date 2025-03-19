const express = require("express")
const router = express.Router();
const { isAdmin } = require('../middleware/checkingRole')
const { verifyToken } = require('../controller/auth')
const { createType, fetchType, updateType } = require('../controller/vehicleType')

router.post("/api/admin/vehicleType",verifyToken, isAdmin, createType )

router.get("/api/vehicleType", fetchType )

router.put("/api/admin/vehicleType/:id", verifyToken, isAdmin, updateType)

module.exports = router