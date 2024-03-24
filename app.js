const express = require('express')
const app = express()
require('dotenv').config()
const bodyParser = require('body-parser')
const path = require('path')
const connectDB = require('./db/connect')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const multer = require('multer')
const flash = require('connect-flash');
const PORT = process.env.PORT || 5000;

const Recruiter = require('./models/admin/recruiter')
const Applicant = require('./models/user/applicant')

const store = new MongoDBStore({
    uri: process.env.MONGODB_URL,
    collection: 'sessions'
})

// const fileStorage = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'images')
//     },
//     filename:(req,file,cb)=>{
//         cb(null,Date.now() + '-' + file.originalname)
//     }
// })

// const fileStorageVideo = multer.diskStorage({
//     destination:(req,file,cb)=>{
//         cb(null,'videos')
//     },
//     filename:(req,file,cb)=>{
//         cb(null,Date.now() + '-' + file.originalname)
//     }
// })

// const fileFilter = (req,file,cb)=>{
//     if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
//         cb(null,true)
//     }else{
//         cb({message:'Unsupported File Format'},false)
//     }
// }

// const fileFilterVideo = (req,file,cb)=>{
//     if(file.mimetype === 'video/mp4'){
//         cb(null,true)
//     }else{
//         cb({message:'Unsupported File Format'},false)
//     }
// }

// const uploadImage = multer({
//     storage:fileStorage,
//     fileFilter:fileFilter
// })

// const uploadVideo = multer({
//     storage:fileStorageVideo,
//     fileFilter:fileFilterVideo
// })

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        if(file.fieldname === 'image'){
            cb(null,'images')
        }else if(file.fieldname === 'video'){
            cb(null,'videos')
        }else if(file.fieldname === 'tech_image'){
            cb(null,'tech_images')
        }
    },
    filename:(req,file,cb)=>{
        if(file.fieldname === 'image'){
            cb(null,Date.now() + '-' + file.originalname)
        }else if(file.fieldname === 'video'){
            cb(null,Date.now() + '-' + file.originalname)
        }else if(file.fieldname === 'tech_image'){
            cb(null,Date.now() + '-' + file.originalname)
        }
    }
})

const fileFilter = (req,file,cb)=>{
    if (!req.fileValidationError) {
        req.fileValidationError = {};
    }
    if(file.fieldname === 'image'){
        if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
                cb(null,true)
        }else{
                req.fileValidationError.image = 'File type not supported-image';
                return cb(null,false, req.fileValidationError.image)
        }
    }else if(file.fieldname === 'video'){
        if(file.mimetype === 'video/mp4'){
                cb(null,true)
        }else{
            req.fileValidationError.video = 'File type not supported!-video';
                cb(null,false, req.fileValidationError.video)
        }
    }else if(file.fieldname === 'tech_image'){
        if(file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg'){
                cb(null,true)
        }else{
            req.fileValidationError.tech_image = 'Unsupported File Format!-tech_image';
                cb(null,false,req.fileValidationError.tech_image)
        }
    }
}

const upload = multer({
    storage:storage,
    fileFilter:fileFilter
}).fields([
    {
        name:'image',
        maxCount:3
    },
    {
        name:'video',
        maxCount:2
    },
    {
        name:'tech_image',
        maxCount:1
    }
])


app.set('view engine','ejs');
app.set('views','views')

const adminRoutes = require('./routes/admin_routes')
const userRoutes = require('./routes/user_routes')
const error_controller = require('./controllers/error_controller')

app.use(bodyParser.urlencoded({extended:false}));
// app.use(session({secret: 'my secret',resave:false,saveUninitialized: false,store:store}))
// app.use(uploadImage.array('image',3));
// app.use(uploadVideo.array('video',3));


app.use(express.static(path.join(__dirname,'public')))
app.use(upload)
app.use('/images',express.static(path.join(__dirname,'images')))
app.use('/videos',express.static(path.join(__dirname,'videos')))
app.use('/tech_images',express.static(path.join(__dirname,'tech_images')))


const userSession = {
    secret: 'my secret',
    resave:false,
    saveUninitialized: false,
    name: 'user_session',
    store:store,
}

const adminSession = {
    secret: 'my secret admin',
    resave:false,
    saveUninitialized: false,
    name: 'admin_session',
    store:store,
}
app.use('/user',session(userSession))
app.use('/admin',session(adminSession))
app.use('/user', flash());
app.use('/admin', flash());

// app.use((req,res,next)=>{
//     res.setHeader('Access-Control-Allow-Origin','*');
//     res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE')
//     res.setHeader('Access-Control-Allow-Headers','Content-Type,Authorization')
// })
// app.use((req,res,next)=>{
//     res.locals.isAuthenticated = req.session.isLoggedIn;
//     // res.locals.csrfToken = req.csrfToken();
//     next()
// })
app.use('/admin',async(req,res,next)=>{
    if(!req.session.admin){
        return next();
    }
    try{
    const recruiter = await Recruiter.findById(req.session.admin._id);

        if(!recruiter){
            return next();
        }
        req.admin = recruiter;
        // console.log(req.admin);
        next();
    }catch(err){
        console.log(err)
    }
})

app.use('/user',async(req,res,next)=>{
    if(!req.session.user){
        return next();
    }
    try{
    const applicant = await Applicant.findById(req.session.user._id);

        if(!applicant){
            return next();
        }
        req.user = applicant;
        next();
    }catch(err){
        console.log(err)
    }
})
// app.get("/",(req,res)=>{
//     // res.send("Hi I am live")
//     res.status(200).render('user/user_job_post',{pageTitle:'Job Posts'})
// })

app.use('/admin',adminRoutes)
app.use('/user',userRoutes)
app.use(error_controller.get404);

// app.use((req,res)=>{
//     res.status(404).render('404',{pageTitle:'Page not found'})
// })

const start = async()=>{
    try{
        await connectDB(process.env.MONGODB_URL);
        app.listen(PORT,()=>{
            console.log(`${PORT} Yes I am connected`);
        })
    }catch(err){
        console.log(err);
    }
}

start()