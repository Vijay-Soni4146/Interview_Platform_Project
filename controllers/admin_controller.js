const Recruiter = require('../models/admin/recruiter');
const Application = require('../models/user/application');
const ApplicationStatus = require('../models/admin/application_status');
const JobPost = require('../models/admin/job_post');
require('dotenv').config();
const notifier = require('node-notifier');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path')
const ejs = require('ejs');
const {validationResult} = require('express-validator')
const mongoose = require('mongoose');

const ITEMS_PER_PAGE = 3;
exports.getJobPost = async(req,res)=>{
    
    const page = +req.query.page || 1;
    try{
        
     let totalItems = await JobPost.find().countDocuments();
     const data = await JobPost.find().skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);
       //  res.status(200).json({msg:'Fetched applicants successfully (getAddApplicant).',applicants:data})
           res.render('admin/admin_job_posts',{
               path:'/admin_job_posts',
               pageTitle:'Job Posts',
               posts:data,
               admin:true,
               isAuthenticated: req.session.isLoggedIn,
               currentPage:page,
               hasNextPage:ITEMS_PER_PAGE * page <totalItems,
               hasPreviousPage:page > 1,
               nextPage:page+1,
               previousPage:page-1,
               lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
           })
       }catch(err){
               console.log(err);
       }
}

exports.getAddRecruiter = async(req,res)=>{
    
    if(req.session.isLoggedIn){
        return res.redirect('/admin');
    }
    
    let message = req.flash('user_flash');
    if(message.length>0){
        message = message[0];
    }else{
        message = null
    }
    res.render('admin/signup',{
        path:'/add-recruiter',
        pageTitle:'Signup',
        admin:true,
        isAuthenticated:false,
        oldInput:{
            email:'',
            password:'',
            name:'',
            designation:''
        },
        errorMessage:message,
        validationErrors:[]
    })
}

exports.postAddRecruiter = async(req,res)=>{
    
    const email = req.body.email;
    const name = req.body.name;
    const password = req.body.password;
    const designation = req.body.designation;
    // console.log(email,name)
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        // console.log(errors.array())
       return res.render('admin/signup',{
            path:'/admin/add-recruiter',
            pageTitle:'Signup',
            admin:true,
            isAuthenticated:false,
            oldInput:{
                email:email,
                password:password,
                name:name,
                designation:designation
            },
            validationErrors:errors.array(),
            errorMessage:''
        })
    }
    
    try{
    const recruiter_exists = await Recruiter.findOne({email:email})
    if(recruiter_exists){
        console.log('recruiter exists');
        return res.render('admin/signup',{
            path:'/admin/add-recruiter',
            pageTitle:'Signup',
            admin:true,
            isAuthenticated:false,
            oldInput:{
                email:email,
                password:password,
                name:name,
                designation:designation
            },
            errorMessage:'Recruiter already exists',
            validationErrors:[]
        }) 
    }else{
        const recruiters = new Recruiter({
            email: email,
            password:password,
            name: name,
            designation:designation
        });
        await recruiters.save();
        notifier.notify({
            title: 'Signup',
            message: 'Signup Successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin/login-recruiter')
     }
    }catch(err){
        console.log(`Error in (postAddRecruiter) ${err}`)
    }
}

exports.getLoginRecruiter = async(req,res)=>{
    // console.log(req.session.isLoggedIn);
    let message = req.flash('user_flash');
    if(message.length>0){
        message = message[0];
    }else{
        message = null
    }
    res.render('admin/login',{
        path:'/login-recruiter',
        pageTitle:'Login',
        isAuthenticated: false,
        admin:true,
        oldInput:{
            email:'',
            password:''
        },
        validationErrors:[],
        errorMessage:message
    })
}

exports.postLoginRecruiter = async(req,res)=>{
    // req.session.isLoggedIn = true;
    // res.redirect('/admin')
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        // console.log(errors.array())
       return res.render('admin/login',{
            path:'/admin/login-recruiter',
            pageTitle:'Login',
            admin:true,
            isAuthenticated:req.session.isLoggedIn,
            oldInput:{
                email:email,
                password:password,
            },
            validationErrors:errors.array(),
            errorMessage:''
        })
    }
    try{
        const recruiter = await Recruiter.findOne({email:email,password:password})
        if(!recruiter){
            return res.status(422).render('admin/login',{
                path:'/login-recruiter',
                pageTitle:'Login',
                admin:true,
                isAuthenticated:false,
                oldInput:{
                    email:email,
                    password:password
                },
                validationErrors:[],
                errorMessage:'Please Enter a valid email or password'
            })
        }else{
            req.session.isLoggedIn = true;
            req.session.admin = recruiter;
            notifier.notify({
                title: 'Login',
                message: 'Login Successfully.',
                icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
            })
            res.redirect('/admin')
            // console.log(res.status(200).json({msg:"Applicants login successfully.",data:{email}}))
        }
    }catch(err){
            console.log(err)
    }
}

exports.postLogoutRecruiter = async(req,res)=>{
    req.session.destroy((err)=>{
        console.log(err);
        res.redirect('/admin')
    })
}

exports.getAddPost = async(req,res)=>{
    
    res.render('admin/admin_job_post',{
        path:'/admin/admin_job_post',
        pageTitle:'Admin Job Post',
        admin:true,
        editing:false,
        isAuthenticated: req.session.isLoggedIn
    })
}

exports.postAddPost = async(req,res)=>{
    const job_name = req.body.job_name;
    const short_desc = req.body.short_desc;
    const description = req.body.description;
    const experience = +req.body.experience;
    const tech_image = req.files.tech_image;
    const tech_image_path = tech_image.map(obj=>{
        return {
            path:obj.path.replace(/\\/g, "/")
        }
    })
    const tech_image_url = tech_image_path[0].path;
    // .path.replace(/\\/g, "/")
    // console.log(job_name,short_desc,description,experience,tech_image_url)
    // console.log(email,name)
    const job_post = new JobPost({
        jobPostName: job_name,
        techImage:tech_image_url,
        shortDesc:short_desc,
        description: description,
        experience:experience,
        recruiterDetail:req.admin
      });
    try{
        const jobPost = await job_post.save();
        const recruiterId = jobPost.recruiterDetail._id;
        // const recruiter = await Recruiter.findById({_id:recruiterId});
        req.admin.addToApp(jobPost)
        // console.log(recruiter);
        // res.status(201).json({msg:"Job post added successfully..",data:job_post})
        notifier.notify({
            title: 'Add Post',
            message: 'Post added successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin');
    }catch(err){
        console.log(`Error in (postAddPost) ${err}`)
    }
}

exports.getEditPost = async(req,res)=>{
    const editMode = req.query.edit;
    if(!editMode){
        return res.redirect('/admin')
    }
    const postId = req.params.postId;
    try{
        const post = await JobPost.findById(postId);
        if(!post){
            return res.redirect('/admin')
        }
        res.render('admin/admin_job_post',{
            path:'/admin/admin_job_post',
            pageTitle:'Edit Admin Job Post',
            post:post,
            admin:true,
            editing:editMode,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(err)
    }
}

exports.postEditPost = async(req,res)=>{
    const postId = req.body.postId;
    const updated_job_name = req.body.job_name;
    const updated_short_desc = req.body.short_desc;
    const updated_description = req.body.description;
    const updated_experience = req.body.experience;
    // console.log(email,name)
    const tech_image = req.files.tech_image;
    const tech_image_path = tech_image.map(obj=>{
        return {
            path:obj.path.replace(/\\/g, "/")
        }
    })
    const tech_image_url = tech_image_path[0].path;

    try{
        const post = await JobPost.findById(postId)

        if(post.recruiterDetail.toString() !== req.admin._id.toString()){
            return res.redirect('/admin')
        }

        post.jobPostName= updated_job_name;
        post.techImage = tech_image_url;
        post.shortDesc=updated_short_desc;
        post.description= updated_description;
        post.experience=updated_experience;
        await post.save()
        // res.status(201).json({msg:"Job post updated successfully..",data:post})
        console.log('UPDATED POST SUCCESSFULLY.')
        notifier.notify({
            title: 'Edit Post',
            message: 'Post edited successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin')
    }catch(err){
        console.log(`Error in (postJobPost) ${err}`)
    }
}

exports.deleteJobPost = async(req,res)=>{
    const postId = req.body.postId;
    try{
        const post = await JobPost.findById(postId);

        if(!post){
            console.log('No post found!');
        }
        if(post.recruiterDetail.toString() !== req.admin._id.toString()){
            notifier.notify({
                title: 'Not created by you',
                message: 'You cannot delete this post!', 
                icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
            })
            return res.redirect('/admin')
        }
        await JobPost.deleteOne({_id:postId,recruiterDetail:req.admin._id})

        req.admin.removeFromApp(postId)

        console.log("DESTROYED POST...");
        notifier.notify({
            title: 'Delete Post',
            message: 'Post Deleted Successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin')
    }catch(err){
        console.log(`Error in (deleteJobPost) ${err}`)
    }
}

exports.getApplicationEvaluation = async(req,res)=>{
    // console.log("Hello")
    // try{
    //     const data = await ApplicantEvaluation.find();
    //     res.status(200).json({msg:'Fetched applicants details successfully.',applicants_detail:data})
    // }catch(err){
    //     console.log(`Error in (getApplicationEvaluation) ${err}`)
    // }
   
    try{
        const applications = await Application.find({})
        // console.log(applications)
        res.render('admin/applicant_evaluation',{
            path:'/admin/application_evaluation',
            pageTitle:'Application Evaluation',
            applications:applications,
            admin:true,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getApplicationEvaluation) ${err}`)
    }
}

exports.getDetailApplicationEvaluation = async(req,res)=>{
   
    const applicationId = req.params.applicationId;
    // console.log(applicationId);
    const postId = req.query.job;
    // console.log(postId);
    try{
        const applications = await Application.findById({_id:applicationId})
        // console.log(applications);
        const job_post_index = applications.job_posts.findIndex(d=>{
            return d._id.toString() === postId;
        })
        const document_index = applications.documents.findIndex(d=>{
            return d.job_postId.toString() === postId;
        }) 

        // console.log(document_index);
        // console.log(job_post_index);
        // console.log(applications)
        
        res.render('admin/admin_detail_evaluation',{
            path:'/admin/admin_detail_evaluation',
            pageTitle:'Detail Application Evaluation',
            application:applications,
            document:document_index,
            job_post:job_post_index,
            admin:true,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getDetailApplicationEvaluation) ${err}`)
    }
}

exports.postApproved = async(req,res)=>{
    const applicationId = req.body.applicationId;
    const applicantId = req.body.applicantId;
    const jobPostId = req.body.jobPostId;
    const documentId = req.body.documentId;
    const dateTime = req.body.datetime;
    const recruiterId = req.admin._id;
    const imagePaths = req.body.images;
    const videoPaths = req.body.videos;
    // console.log(applicationId,applicantId,jobPostId,dateTime,recruiterId,documentId,images,videos);
    const imageObjects = imagePaths.split(',').map(path => ({ path }));
    console.log(imageObjects);
    const videoObjects = videoPaths.split(',').map(path => ({ path }));
    console.log(videoObjects);

    const jobPost = await JobPost.findOne({_id:jobPostId});
    console.log(jobPost)

    try{
    //     // const status = await ApplicationStatus.
        const application_status = new ApplicationStatus({
            status: 'approved',
            applicationId:applicationId,
            applicantId:applicantId,
            jobPostId: jobPost,
            recruiterId:recruiterId,
            documents:{
                image:imageObjects,
                video:videoObjects
            },
            date_scheduled:dateTime
        })
        const status = await application_status.save();
        console.log('Application status added...');

        const application_delete = await Application.findOne({_id:applicationId});
        const updated_application_jobPost = application_delete.job_posts.filter(jobPost=>{
            return jobPost._id.toString() !== jobPostId.toString()
        })
        
        const updated_application_document = application_delete.documents.filter(document=>{
            return document._id.toString() !== documentId.toString();
        })

        const updated_application = await Application.findByIdAndUpdate({_id:applicationId},{$set:{job_posts:updated_application_jobPost,documents:updated_application_document}})
        console.log('UPDATED APPLICATION JOBPOSTS...');
        notifier.notify({
            title: 'Approved Application',
            message: 'Approved Application Successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin/approved-evaluation')
    }catch(err){
        console.log(`Error in (postApproved) ${err}`)
    }
}

exports.getApproved = async(req,res)=>{
    
    try{

        const approvedApplication = await ApplicationStatus.find({status:'approved'}).populate('applicantId')
        // console.log(approvedApplication);
        res.render('admin/approved_evaluation',{
            path:'/admin/approved_evaluation',
            pageTitle:'Approved Applications',
            application:approvedApplication,
            admin:true,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getApproved) ${err}`)
    }
}


exports.postRejected = async(req,res)=>{

    const applicationId = req.body.applicationId;
    const applicantId = req.body.applicantId;
    const jobPostId = req.body.jobPostId;
    const documentId = req.body.documentId;
    const dateTime = req.body.datetime;
    const recruiterId = req.admin._id;
    const imagePaths = req.body.images;
    const videoPaths = req.body.videos;
    // console.log(applicationId,applicantId,jobPostId,dateTime,recruiterId,documentId,images,videos);
    const imageObjects = imagePaths.split(',').map(path => ({ path }));
    console.log(imageObjects);
    const videoObjects = videoPaths.split(',').map(path => ({ path }));
    console.log(videoObjects);

    const jobPost = await JobPost.findOne({_id:jobPostId});
    console.log(jobPost)

    try{

        const application_status = new ApplicationStatus({
            status: 'rejected',
            applicationId:applicationId,
            applicantId:applicantId,
            jobPostId: jobPost,
            recruiterId:recruiterId,
            documents:{
                image:imageObjects,
                video:videoObjects
            },
        })
        const status = await application_status.save();
        console.log('Application status added...');

        const application_delete = await Application.findOne({_id:applicationId});
        const updated_application_jobPost = application_delete.job_posts.filter(jobPost=>{
            return jobPost._id.toString() !== jobPostId.toString()
        })
        
        const updated_application_document = application_delete.documents.filter(document=>{
            return document._id.toString() !== documentId.toString();
        })

        const updated_application = await Application.findByIdAndUpdate({_id:applicationId},{$set:{job_posts:updated_application_jobPost,documents:updated_application_document}})
        console.log('UPDATED APPLICATION JOBPOSTS...')
        notifier.notify({
            title: 'Rejected Application',
            message: 'Application rejected successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin/rejected-evaluation')
    }catch(err){
        console.log(`Error in (postRejected) ${err}`)
    }
}

exports.getRejected = async(req,res)=>{
    
    try{

        const rejectedApplication = await ApplicationStatus.find({status:'rejected'}).populate('applicantId')
        // console.log(rejectedApplication);
        res.render('admin/rejected_evaluation',{
            path:'/admin/rejected_evaluation',
            pageTitle:'Rejected Applications',
            application:rejectedApplication,
            admin:true,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getRejected) ${err}`)
    }
}

exports.getApprovedDetailApplicationEvaluation = async(req,res)=>{
   
    const applicationId = req.params.applicationId;
    // console.log(applicationId);
    const postId = req.query.job;
    // console.log(postId);
    try{
        const applications = await ApplicationStatus.findOne({applicationId:applicationId,'jobPostId._id':new mongoose.Types.ObjectId(postId)}).populate('applicantId applicationId')
        console.log(applications);
        
        res.render('admin/approved_detail_evaluation',{
            path:'/admin/approved_detail_evaluation',
            pageTitle:'Approved Detail Application',
            application:applications,
            admin:true,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getApprovedDetailApplicationEvaluation) ${err}`)
    }
}

exports.getRejectedDetailApplicationEvaluation = async(req,res)=>{
    
    const applicationId = req.params.applicationId;
    // console.log(applicationId);
    const postId = req.query.job;
    // console.log(postId);
    try{
        const applications = await ApplicationStatus.findOne({applicationId:applicationId,'jobPostId._id':new mongoose.Types.ObjectId(postId)}).populate('applicantId applicationId')
        console.log(applications);
        
        res.render('admin/rejected_detail_evaluation',{
            path:'/admin/rejected_detail_evaluation',
            pageTitle:'Rejected Detail Application',
            application:applications,
            admin:true,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getRejectedDetailApplicationEvaluation) ${err}`)
    }
}

exports.postRescheduleApprovedEvaluation = async(req,res)=>{
    const applicationId = req.body.applicationId;
    const applicantId = req.body.applicantId;
    const jobPostId = req.body.jobPostId;
    const dateTime = req.body.datetime;
    // console.log(applicationId,applicantId,jobPostId,dateTime);
    try{
        const status = await ApplicationStatus.findOneAndUpdate({applicationId:new mongoose.Types.ObjectId(applicationId),'jobPostId._id':new mongoose.Types.ObjectId(jobPostId)},{$set:{date_scheduled:dateTime}})
        // console.log(status);
        notifier.notify({
            title: 'Rescheduled',
            message: 'Rescheduled Interview Successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/admin/approved-evaluation');

    }catch(err){
        console.log(`Error in (postRescheduleApprovedEvaluation) ${err}`)
    }
}



exports.getResetPasswordAdmin = async(req,res)=>{
    // console.log("fired");
    try{
        const admin_data = await Recruiter.findOne({_id:req.admin._id})
        // console.log(admin_data);
        res.render('admin/reset_password_admin',{
            path:'/admin/reset_password_admin',
            pageTitle:'Admin Reset Password',
            admin:true,
            admin_data:admin_data,
            isAuthenticated: req.session.isLoggedIn
        })
    }catch(err){
        console.log(`Error in (getResetPassword) ${err}`)
    }
}

exports.postResetPasswordAdmin = async(req,res)=>{
    console.log('In postResetPasswordAdmin');
    const email = req.body.email;
    console.log(email);

    const filePath = path.join(__dirname,'../views/admin/reset_password_mail_admin.ejs')
    try{
        const adminData = await Recruiter.findOne({email:email})
        // console.log(adminData);
        if(!adminData){
            req.flash('error','No account with that email found.')
            return res.redirect('/admin/forget-password-admin')
        }
        const tokenLength = 16;
        const token = crypto.randomBytes(tokenLength).toString('hex');
        // console.log('Random token:', token);
        adminData.resetToken = token;
        adminData.resetTokenExpiration = Date.now() + 3600000;
        await adminData.save();

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASSWORD
        }
    });
    ejs.renderFile(filePath, {adminData}, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            var mainOptions = {
                from: process.env.NODEMAILER_USER,
                to: 'vjaysoni2202@gmail.com',
                subject: 'Reset Password',
                html: data
            };
            // console.log("html data ======================>", mainOptions.html);
            transporter.sendMail(mainOptions, function (err, info) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Message sent: ' + info.response);
                }
            });
        }
        });
        notifier.notify({
            title: 'Password reset',
            message: 'An email with instructions to reset your password has been sent to your email address.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        return res.redirect('/admin/reset-password-admin')
    }catch(err){
        console.log(`Error in (postResetPassword) ${err}`)
    }
}

exports.getResetPasswordConfirmAdmin = async(req,res)=>{

    const token = req.params.token;
    try{
        const admin = await Recruiter.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})

        res.render('admin/reset_password_confirm_admin',{
            path:'/admin/reset_password_confirm_admin',
            pageTitle:'Admin Reset Password',
            admin:true,
            isAuthenticated: req.session.isLoggedIn,
            adminId:admin._id.toString(),
            passwordToken:token
        })
    }catch(err){
        console.log(`Error in (getResetPasswordConfirm) ${err}`)
    }
}

exports.postResetPasswordConfirmAdmin = async(req,res)=>{
    const newPassword = req.body.password;
    const adminId = req.body.adminId;
    const passwordToken = req.body.passwordToken;
        try{
            let resetAdmin = await Recruiter.findOne({resetToken:passwordToken,resetTokenExpiration:{$gt:Date.now()},_id:adminId}) 
            resetAdmin.password = newPassword;
            resetAdmin.resetToken = undefined;
            resetAdmin.resetTokenExpiration = undefined;
            await resetAdmin.save();
            notifier.notify({
                title: 'Reset Passsword',
                message: 'Password updated successfully.',
                icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
            })
            res.redirect('/admin')
        }catch(err){
            console.log(`Error in (postResetPasswordConfirm) ${err}`)
        }
}

exports.getForgetPassword = async(req,res)=>{
    let message = req.flash('error')
    if(message.length>0){
        message = message[0]
    }else{
        message=null;
    }
    try{
        res.render('admin/forget_password',{
            path:'/admin/forget_password',
            pageTitle:'Admin Forget Password',
            admin:true,
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: message
        })
    }catch(err){
        console.log(`Error in (getForgetPassword) ${err}`)
    }
}