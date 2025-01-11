

const mongoose = require("mongoose");
const { SELLER, BUYER } = require("../constant");


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true,"required name"],
    },
    email: {
        type: String,
        required: true,
        unique:true,
        validate:{
            validator:async function(req_value){
                let count=await mongoose.models.User.countDocuments({email:req_value})
            
            if (count){
                return false
            }
            return true
        },
        message:"Email already in use ..."
            
        }
    },
    password: {
        type: String,
        required: true,
        select:false
    },
    role: {
        type:String,
        enum: [SELLER,BUYER],
        required: true,
        set: function (value) {
            return value.toLowerCase();
        }



    },
    verificationCode:{
        type:String,
        required:false
    },
    isVerified:{
        type:Boolean,
        required:true,
        default:false,
    }
    
}
,{
    timestamps:true,
})

module.exports=mongoose.model("User",userSchema)