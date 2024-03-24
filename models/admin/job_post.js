const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobPostSchema = new Schema({
    jobPostName:{
        type:String,
        required:true
    },
    techImage:{
        type:String,
        required:true
    },
    shortDesc:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    experience:{
        type:Number,
        required:true
    },
    recruiterDetail:{
       type:Object,
       ref:'Recruiter'
    }
})

module.exports = mongoose.model('JobPost',jobPostSchema)