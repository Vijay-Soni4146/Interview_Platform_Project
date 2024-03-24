module.exports = (req,res,next)=>{
    if(!req.session.isLoggedInUser){
        return res.redirect('/user/login-applicant');
    }
    next();
}