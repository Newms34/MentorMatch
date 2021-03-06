const mongoose = require('mongoose');

const lessonReqSchema = new mongoose.Schema({
    user: String, //(user)name of the user requesting this lesson,
    displayName:String,
    topics:[{required:true,type:String}],
    answerers:[{
        user:{type:String,required:true},
        displayName:String
    }]//if this is answered, it'll still be displayed until both users accept
}, {
    collection: 'LessonRequest'
});

const LessonRequest = mongoose.model('LessonRequest', lessonReqSchema);
module.exports = LessonRequest;