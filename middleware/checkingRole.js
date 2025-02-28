const {ADMIN, CUSTOMER} = require("../constant");

const isAdmin=(req,res,next)=>{

    const role=req.user.role;

    if (role === ADMIN){
        next();
    }
    else{
        res.status(403).send(
            {
                message:"Access denied! you don't have admin previlage"
            }
        )
    }

}


const isNotVendor=(req,res,next)=>{
    const role=req.user.role;

    if(role=== ADMIN || role===CUSTOMER){
        next();
    }
    else
    {
        res.status(403).send(
            {
                message:"Access denied! only for admin and customers"
            }
        )
    }

    
}



module.exports={isAdmin,isNotVendor}