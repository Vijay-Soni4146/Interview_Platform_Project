const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recruiterSchema = new Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    designation:{
        type:String,
        required:true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    jobpost:{
        posts:[{
            postId:{type:Object,required:true}
        }]
    }
})

recruiterSchema.methods.addToApp = function(post){
    // const appPostIndex = this.jobpost.posts.findIndex(jp =>{
    //     return jp.postId.toString() === post._id.toString()
    // })
    const updatedPosts = [...this.jobpost.posts];

    updatedPosts.push({postId:post})
    const updatedJobPost = {
        posts: updatedPosts
    } 
    this.jobpost = updatedJobPost;
    return this.save()
}

recruiterSchema.methods.removeFromApp = function(postId){
    const updatedPostArray = this.jobpost.posts.filter(post =>{
        return post.postId._id.toString() !== postId.toString()
    })
    this.jobpost.posts = updatedPostArray;
    return this.save()
}

recruiterSchema.methods.clearPosts = function(){
    this.jobpost = {posts:[]}
    return this.save()
}

module.exports = mongoose.model('Recruiter',recruiterSchema)