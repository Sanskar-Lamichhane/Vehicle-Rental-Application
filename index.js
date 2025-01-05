const express = require("express")
const app = express();
require('dotenv').config()
require("./config/database")


const auth_routes=require("./routes/auth");
const { handleResourceNotFound, handleServerError } = require("./middleware/error");



app.use(express.json()) //global middleware









app.use(auth_routes)







app.use(handleServerError);
app.use(handleResourceNotFound);







app.listen(3000, () => {
    console.log("Server Started.")
})















