const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicationSchema = new Schema({
    experience:{
        type: Number,
        required: true
    },
    date_of_application:{
        type:Date,
        required:true
    },
    applicant_details:{
            type:Object,
            required:true
    },
    job_posts:[{
            type: Object,
            required:true  
    }],
    documents:[{
        image:[{
            type:Object,
            required:true
        }],
        video:[{
            type:Object,
            required:true
        }],
        last_updated:{
            type:Date,
            required:true
        },
        job_postId:{
            type:Object,
        }
    }]
})

module.exports = mongoose.model('Application',applicationSchema)