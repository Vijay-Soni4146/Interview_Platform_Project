const Applicant = require('../models/user/applicant');
const Application = require('../models/user/application');
const JobPost = require('../models/admin/job_post');
const ApplicationStatus = require('../models/admin/application_status');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path')
const ejs = require('ejs');
const notifier = require('node-notifier');
const {validationResult} = require('express-validator')
const mongoose = require('mongoose')

exports.getAddApplicant = async(req,res)=>{
    // res.status(200).json({
    //     email:"test@gmail.com",name:'Test'
    // })
    if(req.session.isLoggedInUser){
        return res.redirect('/user');
    }

    let message = req.flash('user_flash');
    if(message.length>0){
        message = message[0];
    }else{
        message = null
    }
    res.render('user/signup',{
        path:'/add-applicant',
        pageTitle:'Signup',
        admin:false,
        isAuthenticated:false,
        oldInput:{
            name:'',
            email:'',
            password:'',
            mobile:''
        },
        errorMessage:message,
        validationErrors:[]
    })

    // try{
    //     const data = await Applicant.find();
    //     res.status(200).json({msg:'Fetched applicants successfully (getAddApplicant).',applicants:data})
    // }catch(err){
    //     console.log(err);
    // }
}

exports.postAddApplicants = async(req,res)=>{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password
    const mobile = req.body.mobile;

    const errors = validationResult(req)
    if(!errors.isEmpty()){
        // console.log(errors.array())
        return res.status(422).render('user/signup',{
            path:'/user/signup',
            pageTitle:'Signup',
            admin:false,
            isAuthenticated:false,
            oldInput:{
                name:name,
                email:email,
                password:password,
                mobile:mobile
            },
            errorMessage:'',
            validationErrors:errors.array()
        })
    }
    // console.log(email,name,password,mobile)
    try{
        const applicant_exists = await Applicant.findOne({email:email})
        if(applicant_exists){
            console.log('Applicant exists');
            return res.status(422).render('user/signup',{
                path:'/user/signup',
                pageTitle:'Signup',
                admin:false,
                isAuthenticated:false,
                oldInput:{
                    name:name,
                    email:email,
                    password:password,
                    mobile:mobile
                },
                errorMessage:'Email already exists please, pick a different one',
                validationErrors:[]
            })
        }else{
            console.log('Applicant does not exists created One');

            const applicants = new Applicant({
                name: name,
                email: email,
                password:password,
                mobile:mobile
            });
            await applicants.save()
            notifier.notify({
                title: 'Signup',
                message: 'Signup successfully.',
                icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
            })
            res.redirect('/user/login-applicant')
        }
        // console.log(res.status(201).json({msg:"Applicants added successfully.",data:applicants}))
    }catch(err){
        console.log(`Error in (postAddApplicants) ${err}`)
    }
}

exports.getLoginApplicant = async(req,res)=>{
    // console.log(req.session.isLoggedIn);
    let message = req.flash('user_flash');
    if(message.length>0){
        message = message[0];
    }else{
        message = null
    }
    res.render('user/login',{
        path:'/login-applicant',
        pageTitle:'Login',
        admin:false,
        isAuthenticated:false,
        oldInput:{
            email:'',
            password:''
        },
        errorMessage:message,
        validationErrors:[]
    })
}

exports.postLoginApplicant = async(req,res)=>{
    // req.session.isLoggedIn = true;
    // res.redirect('/')
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req)
    if(!errors.isEmpty()){
        // console.log(errors.array())
        return res.status(422).render('user/login',{
            path:'/login-applicant',
            pageTitle:'Login',
            admin:false,
            isAuthenticated:false,
            errorMessage:'',
            oldInput:{
                email:email,
                password:password
            },
            validationErrors:errors.array()
        })
    }
    try{
        const applicant = await Applicant.findOne({email:email,password:password})
        // console.log(applicant);
        if(!applicant){
            return res.status(422).render('user/login',{
                path:'/login-applicant',
                pageTitle:'Login',
                admin:false,
                isAuthenticated:false,
                oldInput:{
                    email:email,
                    password:password
                },
                errorMessage:'Invalid email or password',
                validationErrors:[]
            })
        }else{
                req.session.isLoggedInUser = true;
                req.session.user = applicant;
                notifier.notify({
                    title: 'Login',
                    message: 'Login Successfully.',
                    icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
                })
                res.redirect('/user');
            // console.log(res.status(200).json({msg:"Applicants login successfully.",data:{email}}))
        }
    }catch(err){
        console.log(`Error in (postLoginApplicant) ${err}`)
    }
}

exports.postLogoutApplicant = async(req,res)=>{
    req.session.destroy((err)=>{
        console.log(err);
        res.redirect('/user')
    })
}


const ITEMS_PER_PAGE = 3;

exports.getJobPosts = async(req,res)=>{
    const page = +req.query.page || 1;

    try{
     let totalItems = await JobPost.find().countDocuments();
     const data = await JobPost.find().skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE);

     res.render('user/user_job_posts',{
        path:'/user/user_job_posts',
        pageTitle:'Job Posts',
        posts:data,
        admin:false,
        isAuthenticated:req.session.isLoggedInUser,
        currentPage:page,
        hasNextPage:ITEMS_PER_PAGE * page <totalItems,
        hasPreviousPage:page > 1,
        nextPage:page+1,
        previousPage:page-1,
        lastPage:Math.ceil(totalItems/ITEMS_PER_PAGE)
    })
    }catch(err){
        console.log(`Error in (getJobPosts) ${err}`)
    }
}


exports.getJobPost = async(req,res)=>{
    
    const postId = req.params.postId;
    try{
        const post = await JobPost.findById(postId);

        let asIds = [];
        let appIds = [];
        if(!req.session.isLoggedInUser){
            console.log('not Logged in (getJobPost-User) ');
            res.render('user/user_job_post',{
                path:'/user_job_post',
                pageTitle:'Job Post',
                post:post,
                asIds:asIds,
                appIds:appIds,
                admin:false,
                isAuthenticated:req.session.isLoggedInUser,
                imageError:null,
                videoError:null
            })
        }else{
            const applicationStatus = await ApplicationStatus.find({applicantId:req.user._id});
            // console.log(applicationStatus);
            if(applicationStatus.length > 0){
                asIds = applicationStatus.map(i=> {
                    return{ id: i.jobPostId._id.toString()}
                })  
            }
            // console.log(asIds);
            const application = await Application.findOne({'applicant_details._id':req.user._id});
            // console.log(application);
            if(application){
                if(application.job_posts.length > 0){
                    appIds = application.job_posts.map(i=> {
                        return { id: i._id.toString()}
                    })  
                }
            }
            // console.log(appIds);
            res.render('user/user_job_post',{
                path:'/user_job_post',
                pageTitle:'Job Post',
                post:post,
                asIds:asIds,
                appIds:appIds,
                admin:false,
                isAuthenticated:req.session.isLoggedInUser,
                imageError:null,
                videoError:null
            })
        }
    }catch(err){
        console.log(`Error in (getJobPost) ${err}`)
    }
    
}

exports.postApplyJobPost = async(req,res)=>{
    // const currentdate = new Date(); 
    // const datetime = currentdate.getDate() + "/"
    //             + (currentdate.getMonth()+1)  + "/" 
    //             + currentdate.getFullYear() + " @ "  
    //             + currentdate.getHours() + ":"  
    //             + currentdate.getMinutes() + ":" 
    //             + currentdate.getSeconds();
    const postId = req.body.postId;
    // console.log(postId)
    const experience = req.body.experience;
    const image = req.files.image;
    const video = req.files.video;
    // console.log(image,video)
    try{
        const post = await JobPost.findOne({_id:postId}) 
        // console.log(post)
        if(req.fileValidationError.image || req.fileValidationError.video){
            console.log(req.fileValidationError.image);
            
            console.log(req.fileValidationError.video)
            return res.render('user/user_job_post',{
                path:'/user_job_post',
                pageTitle:'Job Post',
                post:post,
                asIds:[],
                appIds:[],
                admin:false,
                isAuthenticated:req.session.isLoggedInUser,
                imageError:req.fileValidationError.image,
                videoError:req.fileValidationError.video
            })
        }
    }catch(err){
        console.log(`${err} in image or video upload in (postApplyJobPost)`)
    }

    const imageUrl = image.map(obj=>{
        return {
            path:obj.path.replace(/\\/g, "/")
        }
    })
    const videoUrl = video.map(obj=>{
        return {
            path:obj.path.replace(/\\/g, "/")
        }
    })

    // const imageurl = image[0].path.replace(/\\/g, "/");
    // .replace(/\\/g, "/")
    // const video = req.files.video;
    // console.log(experience,imageUrl,videoUrl)

    // console.log(req.user)


    try{
        const search = await Application.findOne({'applicant_details._id':req.user._id})
        if(search){
            console.log("User applied exists")
            // console.log(search._id.toString());
            const job_post = await JobPost.findById({_id:postId})
            const job_postId = job_post._id;
            // console.log(job_postId);
            // console.log(job_post)
            // console.log(search.job_posts);

            const updated_job_posts = [...search.job_posts];
            // console.log(updated_job_posts)
            updated_job_posts.push(job_post)
            // console.log(updated_job_posts)

            const documents = [...search.documents];
            documents.push({
                image:imageUrl,
                video:videoUrl,
                last_updated:new Date(),
                job_postId:job_postId
            });
            // console.log(documents);  

            // console.log(imageurldemo[0].image[0].path) ------Most important later used in admin display appliedpost

            const application = await Application.findByIdAndUpdate({_id:search._id},{$set:{job_posts:updated_job_posts,documents:documents}})
            if(application){
                console.log('UPDATED SUCCESSFULLY..');
            }else{
                console.log('not updated (postApplyJobPost)');
            }
        }else{
            const job_post = await JobPost.findById({_id:postId})
            const job_postId = job_post._id;
            // console.log(job_postId);
            const application = new Application({
                experience:experience,
                date_of_application:new Date(),
                applicant_details:req.user,
                job_posts:[job_post],
                documents:[{
                    image:imageUrl,
                    video:videoUrl,
                    last_updated:new Date(),
                    job_postId:job_postId
                }]
            })
            await application.save();
        }
        notifier.notify({
            title: 'Applied Post',
            message: 'Applied Successfully.',
            icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
        })
        res.redirect('/user/application')
    }catch(err){
        console.log(`Error in (postApplyJobPost) ${err}`)
    }
}

exports.getApplication = async(req,res)=>{
    // console.log("Hello")
    // try{
    //     const data = await Application.find();
    //     res.status(200).json({msg:'Fetched applicants details successfully.',application:data})
    // }catch(err){
    //     console.log(`Error in (getApplication) ${err}`)
    // }
    try{
        const applications = await Application.findOne({'applicant_details._id':req.user._id});
        if(!applications){
            res.redirect('/user');
        }
        const application_status = await ApplicationStatus.find({'applicationId':applications._id,'applicantId':req.user._id})
        // console.log(application_status)

        // const jobPostIds = application_status.map(doc=>doc.jobPostId.toString())
        // console.log(jobPostIds)

        // const jobPost = await JobPost.find({_id:{"$in":jobPostIds}});
        // console.log(jobPost);

        // console.log(applications)
        // if(applications){
        //     console.log('exists')
        // }else{
        //     console.log('not applied yet')
        // }
        res.render('user/user_application',{
            path:'/application',
            pageTitle:'Your Applications',
            applications:applications,
            application_status:application_status,
            admin:false,
            isAuthenticated:req.session.isLoggedInUser
        })
    }catch(err){
        console.log(`Error in (getApplication) ${err}`)
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
        // const job_post_index = applications.job_posts.findIndex(d=>{
        //     return d._id.toString() === postId;
        // })
        // // console.log(job_post_index);
        // const document_index = applications.documents.findIndex(d=>{
        //     return d.job_postId.toString() === postId;
        // }) 
        
        res.render('user/approved_detail_evaluation',{
            path:'/user/approved_detail_evaluation',
            pageTitle:'Approved Detail Application',
            application:applications,
            admin:false,
            isAuthenticated: req.session.isLoggedInUser
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
        // console.log( applications);
        
        res.render('user/rejected_detail_evaluation',{
            path:'/user/rejected_detail_evaluation',
            pageTitle:'Rejected Detail Application',
            application:applications,
            admin:false,
            isAuthenticated: req.session.isLoggedInUser
        })
    }catch(err){
        console.log(`Error in (getRejectedDetailApplicationEvaluation) ${err}`)
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
        
        res.render('user/user_detail_application',{
            path:'/user/user_detail_application',
            pageTitle:'Detail Application Evaluation',
            application:applications,
            document:document_index,
            job_post:job_post_index,
            admin:false,
            isAuthenticated: req.session.isLoggedInUser
        })
    }catch(err){
        console.log(`Error in (getDetailApplicationEvaluation) ${err}`)
    }
}

exports.getMyProfile = async(req,res)=>{
    // console.log('Hello');
    try{
        const user_data = await Applicant.findOne({_id:req.user._id})
        // console.log(user_data);
        res.render('user/my_profile',{
            path:'/user/my_profile',
            pageTitle:'User Profile',
            admin:false,
            user_data:user_data,
            isAuthenticated: req.session.isLoggedInUser
        })
    }catch(err){
        console.log(`Error in (getMyProfile) ${err}`)
    }
}

exports.getUpdateProfile = async(req,res)=>{
    // console.log('Hello');
    try{
        const userId = req.params.userId;
        // console.log(userId);
        const user_data = await Applicant.findOne({_id:userId})
        // console.log(user_data);
        res.render('user/update_profile',{
            path:'/user/update_profile',
            pageTitle:'Update User Profile',
            admin:false,
            user_data:user_data,
            isAuthenticated: req.session.isLoggedInUser
        })
    }catch(err){
        console.log(`Error in (getUpdateProfile) ${err}`)
    }
}

exports.postUpdateProfile = async(req,res)=>{
    console.log('Fired');
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const company_name = req.body.company_name;
    const job_title = req.body.job_title;
    const duration = req.body.duration;
    const degree = req.body.degree;
    const institue_name = req.body.institue_name;
    const field = req.body.field;
    const graduation = req.body.graduation;
    const technical = req.body.technical;
    const soft = req.body.soft;
    const empname = req.body.empname;
    const department = req.body.department;
    const designation = req.body.designation;
    const userId = req.body.userId;

    console.log(name,email,mobile,company_name,job_title,duration,degree,institue_name,field,graduation,technical,soft,empname,department,designation,userId)
    try{
        const user = await Applicant.findOne({_id:userId})
        console.log(user)
            const updateFields = {$set:{
                name:name,email:email,mobile:mobile,'profile.work_experience.company_name':company_name,
                'profile.work_experience.job_title':job_title,'profile.work_experience.duration':duration,'profile.education.degree':degree,
                'profile.education.institue_name':institue_name,'profile.education.field':field,'profile.education.graduation':graduation,
                'profile.skills.technical':technical,'profile.skills.soft':soft,'profile.references.name':empname,'profile.references.department':department,'profile.references.designation':designation
            }}
            const update_profile = await Applicant.findByIdAndUpdate({_id:userId},updateFields)
            if(update_profile){
                console.log('updated....');
            }else{
                console.log('not...')
            }
    }catch(err){
        console.log(`Error in (postUpdateProfile) ${err}`)
    }
}

exports.getResetPassword = async(req,res)=>{
    // console.log("fired");
    try{
        const user_data = await Applicant.findOne({_id:req.user._id})
        // console.log(user_data);
        res.render('user/reset_password',{
            path:'/user/reset_password',
            pageTitle:'User Reset Password',
            admin:false,
            user_data:user_data,
            isAuthenticated: req.session.isLoggedInUser
        })
    }catch(err){
        console.log(`Error in (getResetPassword) ${err}`)
    }
}

exports.postResetPassword = async(req,res)=>{
    console.log('In postResetPassword');
    const email = req.body.email;
    // console.log(email);

    const filePath = path.join(__dirname,'../views/user/reset_password_mail.ejs')
    try{
        const userData = await Applicant.findOne({email:email})
        if(!userData){
            req.flash('error','No account with that email found.')
            return res.redirect('/user/forget-password-user')
        }
        // console.log(userData);
        const tokenLength = 16;
        const token = crypto.randomBytes(tokenLength).toString('hex');
        // console.log('Random token:', token);
        userData.resetToken = token;
        userData.resetTokenExpiration = Date.now() + 3600000;
        await userData.save();
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASSWORD
        }
    });
    ejs.renderFile(filePath, {userData}, function (err, data) {
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
        return res.redirect('/user/reset-password-user')
    }catch(err){
        console.log(`Error in (postResetPassword) ${err}`)
    }
}

exports.getResetPasswordConfirm = async(req,res)=>{

    const token = req.params.token;
    try{
        const user = await Applicant.findOne({resetToken:token,resetTokenExpiration:{$gt:Date.now()}})

        res.render('user/reset_password_confirm',{
            path:'/user/reset_password_confirm',
            pageTitle:'User Reset Password',
            admin:false,
            isAuthenticated: req.session.isLoggedInUser,
            userId:user._id.toString(),
            passwordToken:token
        })
    }catch(err){
        console.log(`Error in (getResetPasswordConfirm) ${err}`)
    }
}

exports.postResetPasswordConfirm = async(req,res)=>{
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
        try{
            let resetUser = await Applicant.findOne({resetToken:passwordToken,resetTokenExpiration:{$gt:Date.now()},_id:userId}) 
            resetUser.password = newPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            await resetUser.save();
            notifier.notify({
                title: 'Reset Passsword',
                message: 'Password updated successfully.',
                icon: 'https://s3-us-west-2.amazonaws.com/shipsy-public-assets/shipsy/SHIPSY_LOGO_BIRD_BLUE.png'
            })
            res.redirect('/user')
        }catch(err){
            console.log(`Error in (postResetPasswordConfirm) ${err}`)
        }
}


exports.getForgetPassword = async(req,res)=>{
    // console.log('In getForgetPassword');
    let message = req.flash('error')
    if(message.length>0){
        message = message[0]
    }else{
        message=null;
    }
    try{
        res.render('user/forget_password',{
            path:'/user/forget_password',
            pageTitle:'User Forget Password',
            admin:false,
            isAuthenticated: req.session.isLoggedInUser,
            errorMessage: message
        })
    }catch(err){
        console.log(`Error in (getForgetPassword) ${err}`)
    }
}