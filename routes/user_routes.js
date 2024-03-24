const express = require('express')
const router = express.Router();

const userController = require('../controllers/user_controller')
const isAuth = require('../middleware/isAuthUser')
const { check,body } = require('express-validator');


router.get('/',userController.getJobPosts)

//  /admin/add-applicant => GET
router.get('/add-applicant',userController.getAddApplicant)

router.post('/add-applicant',
    [
        check('email')
        .trim()
        .isEmail()
        .withMessage('Please enter a valid email')
        .normalizeEmail(),
        body('name','Name Should be atleast 3 character long')
        .trim()
        .isString().withMessage("Only String is allowed")
        .isLength({min:3}),
        body('password','Please enter a password')
        .trim()
        .notEmpty().withMessage("Please fill password")
        .isLength({min:3}).withMessage('Password should be atleast 3 characters long'),
        body('mobile','Mobile number should Atleast contain 3 Numbers')
        .trim()
        .isNumeric()
        .isLength({min:3})
    ]
,userController.postAddApplicants)

router.get('/login-applicant',userController.getLoginApplicant)

router.post('/login-applicant',
[
    check('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    body('password','Please enter a valid password')
    .trim()
    .isLength({min:3})
    .isAlphanumeric()
]
,userController.postLoginApplicant)

router.post('/logout-applicant',userController.postLogoutApplicant)

router.get('/job-post/:postId',userController.getJobPost)

router.post('/apply-job-post',userController.postApplyJobPost)

// router.post('/apply-now',userController.postApply)

router.get('/approved-detail-evaluation/:applicationId',isAuth,userController.getApprovedDetailApplicationEvaluation)

router.get('/rejected-detail-evaluation/:applicationId',isAuth,userController.getRejectedDetailApplicationEvaluation)

router.get('/detail-evaluation/:applicationId',isAuth,userController.getDetailApplicationEvaluation)

router.get('/application',isAuth,userController.getApplication)

router.get('/my-profile',isAuth,userController.getMyProfile)

router.get('/update-profile/:userId',isAuth,userController.getUpdateProfile)

router.post('/update-profile',isAuth,userController.postUpdateProfile)

router.get('/reset-password-user',isAuth,userController.getResetPassword)

router.post('/reset-password-user',userController.postResetPassword)

router.get('/reset-password-confirm/:token',userController.getResetPasswordConfirm)

router.post('/reset-password-confirm',userController.postResetPasswordConfirm)

router.get('/forget-password-user',userController.getForgetPassword);

module.exports = router;