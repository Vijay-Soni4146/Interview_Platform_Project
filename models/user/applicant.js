const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const applicantSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    mobile:{
        type:Number,
        required:true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    profile:{
        work_experience:{
            company_name:{
                type:String,
            },
            job_title:{
                type:String,
            },
            duration:{
                type:Number,
            }
        },
        education:{
            degree:{
                type:String,
            },
            institue_name:{
                type:String,
            },
            field:{
                type:String,
            },
            graduation:{
                type:Number,
            }
        },
        skills:{
            technical:{
                type:String,
            },
            soft:{
                type:String,
            }
        },
        references:{
            name:{
                type:String,
            },
            department:{
                type:String,
            },
            designation:{
                type:String,
            }
        }
    }
})



module.exports = mongoose.model('Applicant',applicantSchema)