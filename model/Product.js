const mongoose = require("mongoose")
const Schema1 = mongoose.Schema;
const ObjectId = Schema1.ObjectId;

const ProductSchema = new mongoose.Schema({
    name: {
        required: true,
        type: String,
        minlength: 3,
        maxlength: 255
    },
    price: {
        type: Number,
        required: true,
        min: 0

    },
    images: {
        type: [String],
    },
    description: {
        type: String
    },
    categories: [String],
    stock:{
        type:Number,
        min:0,
        default:0
    },
    created_by: {
        required: true,
        type: ObjectId,
        ref: "User"
    },

    reviews:[
        {
            rating:{
                type:Number,
                min:1,
                max:5,
                required:true,
            },
            created_by:{
                type:ObjectId,
                ref:"User",
                required:true
            },
            comment:{
                type:String
            }
        }
    ]
},
{
    timestamps:true
})


module.exports = mongoose.model("Product", ProductSchema)