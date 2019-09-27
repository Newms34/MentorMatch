const mongoose = require('mongoose'),
    crypto = require('crypto');

const usrSchema = new mongoose.Schema({
    user: String, //(user)name of the user,
    displayName:{type:String,default:null},//the name they wanna be called by (if not null)
    pass: String,
    salt: String,
    email: String,
    googleId: String,
    lastAction: { type: Number, default: Date.now() },
    otherInfo: String,
    company: { type: String, default: null },
    projects: [{ name: String, description: String, position: String }],
    reset: String,
    avatar: { type: String, default: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAACNCAIAAAAPTALlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAANsSURBVHhe7dVRduIwEETR7GkWmK1HhMch9giw1dWyZNf9mZwM2F3vJ1//TM1N9dxUz0313FTPTfVGb/r9Fh8azIhNCbYTXx7AWE3JE8CDDjVEU3pI8egjHN+UBgl4QXdHNmV6Ml7W0WFNWdwFr+zlgKYM7Y7X5+vdlH0H4YhkXZuy7FCckqlfUzYNgIPSdGrKmmFwVo6LNi24LEGPpowYDMclSG/KgiFxotqlmxZcKZXblMMHxqFSiU25enicq+OmN1wsktWUYyfB0SJuesPRIilNuXQqnK7gpuB0BX1TbpwQA8Lc9IkBYW66wIYYcVNOmxYzYtx0gRkxbrrAjBhlU+6aHGMC3HSNMQFuusaYADddY0yAm64xJsBNK9jTStaUc06BSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrWRNCy6aH3tauekaYwLcdI0xAW66xpgAN11jTICbrjEmQNm04K5pMSPGTReYEeOmC8yIcdMFZsSImxZcNyEGhLnpEwPC9E0LbpwKpyu4KThdIaVpwaWT4GgRN73haBE3veFokaymBfcOj3N1EpsWXD0wDpVyU73cpgW3D4kT1dKbFiwYDMcl6NG0YMdIuCzBRZtyVo5OTQvWDICD0vRrWrDpUJySqWvTgmUH4YhkvZsW7OuO1+e7SlPe3cXl/kZxTaZOTRk0Bm5Kk96UHePhvgS5TTl/YBwqldWUk2fAxTopTTl2HtwtIm7KjXNiQ5iyKafNjCUxsqYcNT/2BGiacs5ZsKqVoCmHnAvbmkSbcsIZsXC/UFNefl7s3Km9Ka89O9bu0diUF14DmzdracqrroTl27jpJizfZndTXnI97N9gX1Mef1VU+GRHUx58bbR4y033ocVbW5vySNuQdVNTHmYPdHnBTVvQ5YXPTXmMLVGnxk0bUafmQ1MeYDU0+s+7pnzVXqPUkpuGUGrpZVO+ZJ/Q6w83jaLXH24qQLKHelM+a9tQ7cFNBaj2UGnKB20P2v1yUw3a/Vo35SO2HwXdVIiCbipEwVVT/tNa3TO6qdI9o5sq3TO6qVjJ+GzK7yymlHRTsVLSTcVKSZryC1NwUz031XNTPTfVuzXlRxNxUz031XNTPTfVc1M9N9VzU70v/jWV7+8ffZYE08zo+Y8AAAAASUVORK5CYII=' }, //base64 avatar. default is a blank image
    inMsgs: [{
        from: String,
        date: Number,
        htmlMsg: String,
        rawMsg: String,
        mdMsg: String,
        isRep: { type: Boolean, default: false }
    }],
    outMsgs: [{
        to: [String],
        date: Number,
        htmlMsg: String,
        rawMsg: String,
        mdMsg: String,
        isRep: { type: Boolean, default: false }
    }],
    isBanned: {
        type: Boolean,
        default: false
    },
    locked: {
        type: Boolean,
        default: false
    },
    //each student can optionally "rate" their teacher. These will be displayed on FE as a number of Stars (i.e., Bob gets 3.5/5 stars), along with an optional description (i.e., "Bob was very good, but bad at XYZ")
    ratings: [{
        rateNum: { type: Number, required: true },
        rateText: String,
        rateUsr: {
            type: String,
            required: true
        },
        hideName: {
            //if this is set to anonymous, the rating will be included, but the user's name will be hidden (rating == anonymous)
            type: Boolean,
            default: false
        }
    }],
    mod: {
        type: Boolean,
        default: false
    }, //mods can ban/unban
    //the following is simply a list of interests this user has. It is NOT their current lessons. It also has their experience (1-10) in each topic
    //also has optional "canTeach" param
    interests: [{
        title: String,
        lvl: {
            type: Number,
            default: 0
        },
        canTeach: { type: Boolean, default: false }
    }],
    // teachTopics:[{
    //     title: String,
    //     lvl: {
    //         type: Number,
    //         default: 0
    //     }
    // }],
    teaching: [{
        //list of people this user is TEACHING. one person per entry
        user: String,
        topics: [String],
        active: {
            //after a lesson is "done", the user can rate this lesson, which will also require this be set to false.
            type: Boolean,
            default: true
        },
        deleted: {
            //note that we never actually DELETE a lesson, since we need this to tell if a user can rate a particular teacher. However, deleted lessons will not show up on a teacher's history.
            type: Boolean,
            default: true
        }
    }],
    blocked: [String],//list of users this person doesn't like. :(
    wrongAttempts: { type: Number, default: 0 },

}, {
    collection: 'User'
});

// usrSchema.plugin(passportLocalMongoose, {
//     usernameField: 'user',
//     hashField: 'pass',
//     lastLoginField: 'lastLogin'
// });
const generateSalt = function () {
    return crypto.randomBytes(16).toString('base64');
},
    encryptPassword = function (txt, salt) {
        const plainText = txt.toString();
        console.log('PASSWORD', plainText, salt);
        const hash = crypto.createHash('sha1');
        hash.update(plainText);
        hash.update(salt);
        return hash.digest('hex');
    };
usrSchema.statics.generateSalt = generateSalt;
usrSchema.statics.encryptPassword = encryptPassword;
usrSchema.methods.correctPassword = function (candidatePassword) {
    console.log('slt', this.salt, 'and their pwd:', this.pass);
    return encryptPassword(candidatePassword, this.salt) === this.pass;
};

const User = mongoose.model('User', usrSchema);
module.exports = User;