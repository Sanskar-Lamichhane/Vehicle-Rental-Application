

function handleResourceNotFound(req,res){
    res.status(404).send({
        msg:"Resource Not Found"
    })}

function handleServerError(err,req,res,next){
    console.log(err)
    console.log(err.name)
    console.log(err.stack);
    // console.log(Object.entries(err.errors))


    let statuscode=500;
    // let message="Server Error"
    let errors=[]


   
    if (err.name == "ValidationError") {
        console.log(err)
        statuscode=400;
        // message="Bad Request"
        console.log(Object.entries(err.errors))
        errors = Object.entries(err.errors).map((error) => {
            return {
                params: error[0],
                msg: error[1].message,
            }
        }
        )

    }
    
        res.status(statuscode).send({
            msg:err.message,
            errors
        })
   
}

module.exports={
    handleResourceNotFound,
    handleServerError
}
