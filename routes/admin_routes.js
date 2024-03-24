const express = require('express')
const router = express.Router();
const adminController = require('../controllers/admin_controller')
const isAuth = require('../middleware/isAuthAdmin');
const {check,body} = require('express-validator');

router.get('/',adminController.getJobPost)
//  /admin/add-recruiters => GET
router.get('/add-recruiter',adminController.getAddRecruiter)

router.post('/add-recruiter',
[
    check('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
    body('name','Should contain atleast 3 character')
    .trim()
    .isString()
    .isLength({min:3}),
    body('password','Please enter a password with only numbers,text,special character and atleast 3 characters.')
    .trim()
    .isLength({min:3})
    .notEmpty().withMessage('Please fill password'),
    body('designation','Please enter your designation')
    .trim()
    .isLength({min:2})
]
,adminController.postAddRecruiter)

router.get('/login-recruiter',adminController.getLoginRecruiter)

router.post('/login-recruiter',
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
,adminController.postLoginRecruiter)

router.post('/logout-recruiter',adminController.postLogoutRecruiter)

router.get('/add-job-post',isAuth,adminController.getAddPost)

router.post('/add-job-post',adminController.postAddPost)

router.get('/edit-job-post/:postId',isAuth,adminController.getEditPost)

router.post('/edit-job-post',adminController.postEditPost)

router.post('/delete-job-post',isAuth,adminController.deleteJobPost)

router.get('/create-evaluation',isAuth,adminController.getApplicationEvaluation)

router.get('/detail-evaluation/:applicationId',isAuth,adminController.getDetailApplicationEvaluation)

router.post('/approved-evaluation',adminController.postApproved)

router.post('/rejected-evaluation',adminController.postRejected)

router.post('/reschedule-approved-evaluation',adminController.postRescheduleApprovedEvaluation)

router.get('/approved-detail-evaluation/:applicationId',isAuth,adminController.getApprovedDetailApplicationEvaluation)

router.get('/rejected-detail-evaluation/:applicationId',isAuth,adminController.getRejectedDetailApplicationEvaluation)

router.get('/approved-evaluation',isAuth,adminController.getApproved)

router.get('/rejected-evaluation',isAuth,adminController.getRejected)

router.get('/reset-password-admin',isAuth,adminController.getResetPasswordAdmin)

router.post('/reset-password-admin',adminController.postResetPasswordAdmin)

router.get('/reset-password-confirm-admin/:token',adminController.getResetPasswordConfirmAdmin)

router.post('/reset-password-confirm-admin',adminController.postResetPasswordConfirmAdmin)

router.get('/forget-password-admin',adminController.getForgetPassword);

module.exports = router;