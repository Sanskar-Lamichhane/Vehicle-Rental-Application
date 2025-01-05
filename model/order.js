const mongoose = require("mongoose");
const Product = require("../model/Product");
const { PENDING, COMPLETED, REJECTED } = require("../constant");
const Schema1 = mongoose.Schema;
const ObjectId = Schema1.ObjectId;

const OrderSchema = new mongoose.Schema({
    products:{
        type:[
            {
                product_id:{
                    type:ObjectId,
                    ref:"Product",
                    required:true
                },
                name:{

                    type:String,
                    required:true
                },
                price:{
                    type:Number,
                    min:0,
                    required:true
                },
                quantity:{
                    type:Number,
                    min:0,
                    required:true
                }
               
             
            }
        ],
        validate:{
            validator:async function(req_value){
                console.log(req_value)
                if(req_value===0){
                    return false
                }
            },
            message:"atleast one product... needed"


        },
        required:[true,"atleast one product required"]
    },
    status:{
        type:String,
        enum:[PENDING,COMPLETED,REJECTED],
        required:true,
        default:PENDING

    },
    created_by:{
        type:ObjectId,
        ref:"User",
        required:true
    }
},
{
    timeStamps:true,
})

OrderSchema.post("save",async function(order){
    console.log("saved order")
    console.log(order)
    for(product of order.products){
        let man=await Product.findByIdAndUpdate(product.product_id,
            {
                $inc:{stock:-(product.quantity)}
            },
            {new:true,runValidators:true}
        )
        console.log(man)
    }
})



module.exports = mongoose.model("Order", OrderSchema)
