const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationStatusSchema = new Schema({
    status:{
        type:String,
        enum:['pending','approved','rejected'],
        default:'pending',
        required:true
    },
    applicationId:{
        type:Schema.Types.ObjectId,
        ref:'Application',
        required:true
    },
    applicantId:{
        type:Schema.Types.ObjectId,
        ref:'Applicant',
        required:true
    },
    jobPostId:{
        type:Object,
        required:true
    },
    recruiterId:{
        type:Schema.Types.ObjectId,
        ref:'Recruiter',
        required:true
    },
    documents:{
        image:[{
            type:Object,
            required:true
        }],
        video:[{
            type:Object,
            required:true
        }]
    },
    date_scheduled:{
        type:Date
    },
})

module.exports = mongoose.model('ApplicationStatus',applicationStatusSchema)