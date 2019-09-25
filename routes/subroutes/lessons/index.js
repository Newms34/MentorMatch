const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    axios = require('axios'),
    isMod = (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        });
    };
// NOTE: for the purposes of this app, a lesson is tying two users together, with one as teacher and one as student. These are stored in the TEACHER USER model. 

const routeExp = function (io) {
    this.authbit = (req, res, next) => {
        if (!req.session || !req.session.passport || !req.session.passport.user) {
            //no passport userid
            res.status(401).send('err');
        } else {
            mongoose.model('User').findOne({
                _id: req.session.passport.user
            }, function (err, usr) {
                if (!err && usr && !usr.isBanned && !usr.locked) {
                    usr.lastAction = new Date().toLocaleString();
                    usr.save((errsv, usv) => {
                        // truncus('after auth and LA update, usr is',usv)
                        const cleanUsr = JSON.parse(JSON.stringify(usv));
                        delete cleanUsr.salt;
                        delete cleanUsr.pass;
                        // cleanUsr.inMsgs = [];
                        // cleanUsr.outMsgs = [];
                        // delete cleanUsr.id;
                        req.user = usv;
                        req.cleanUsr = cleanUsr;
                        next();
                    });
                } else {
                    res.status(403).send('err');
                }
            });
        }
    };
    router.post('/lesson', this.authbit, (req, res, next) => {
        //create a new "lesson"
        if (!req.user || !req.lUser || !req.body.topics || !req.body.topics.length) {
            //we're missing either the teacher, the learner, OR the topics.
            //note that the teacher here is the one making the lesson (i.e., calling this route)
            //we should expect req.body.topics to be ONLY topics that this teacher wants to teach for this lesson
            return res.status(400).send('err');
        }
        //now, we need to check to make sure that the teacher wants to teach this, and that the student wants to learn
        mongoose.model('User').find({ user: req.body.lUser }, (err, lu) => {
            //first, does learner exist?
            if (err || !lu) {
                return res.status(400).send('err');
            }
            //now, let's find any topics listed that the teacher does NOT want to teach
            const teachNoWant = req.body.topics.filter(q => !req.user.wantsTo.teach.includes(q)),
                //and the student does not want to learn
                learnerNoWant = req.body.topics.filter(q => !lu.wantsTo.learn.includes(q));
            if (teachNoWant.length || learnerNoWant.length) {
                //either the student or the teacher dont want to learn/teach one of our topics. Can't create a lesson that no one wants to learn!
                return res.status(400).send({
                    status: 'nowant',
                    t: teachNoWant,
                    l: learnerNoWant
                });
            }
            //next, let's make sure that this lesson is not already created
            const alreadyTeaching = req.user.teaching.find(q => {
                return q.user == lu.user && q.topics.sort().join().toString().toLowerCase() == req.body.topics.join().toString().toLowerCase();
            })
            if (alreadyTeaching) {
                return res.status(400).send({
                    status: 'alreadyTeaching',
                    t: req.user.teaching
                })
            }
            //everything should be ok. Add to user model and save
            req.user.teaching.push({ user: lu.user, topics: req.body.topics });
            req.user.save((err, usv) => {
                res.send(usv)
            })
        })
    })
    router.delete('/lesson', this.authbit, (req, res, next) => {
        //remove a lesson. Confirm is on FE.
        if (!req.body.id) {
            res.status(400).send('err')
        }
        const theLesson = req.user.teaching.find(q => q._id == req.body.id);
        if (!theLesson) {
            return res.status(400).send({
                status: 'noTeacher'
            });
        }
        theLesson.deleted = true;
        //note that for the sake of rating, lessons are never actually deleted
        req.user.save((err, usv) => {
            res.send('done');
        })
    });
    router.get('/connectLearner', this.authbit, (req, res, next) => {
        //learner wants to connect: find by teacher
        if (!req.query || !req.query.teacher) {
            res.status(400).send('err');
        }
        mongoose.model('user').find({ user: req.query.teacher }, (err, tc) => {
            if(err||!tc){
                return res.status(400).send('noUsr')
            }
            const hasLesson = !!tc.teaching.filter(q => q.user == req.user.user).length;
            if (!hasLesson) {
                return res.status(400).send({ status: 'noLesson' })
            }
            req.user.outMsgs.push({
                to:req.query.teacher,
                msg:`Hi, ${req.query.teacher}! Student ${req.user.user} wants to connect about one of the lessons you're teaching!`,
                date:Date.now()
            })
            tc.inMsgs.push({
                from:req.query.teacher,
                msg:`Hi, ${req.query.teacher}! Student ${req.user.user} wants to connect about one of the lessons you're teaching!`,
                date:Date.now()
            })
            tc.save();
            req.user.save((err,usv)=>{
                res.send(usv);
            })
        })
    })
    router.get('/connectTeacher', this.authbit, (req, res, next) => {
        //teacher wants to connect: find by student
        if (!req.query || !req.query.learner) {
            res.status(400).send('err');
        }
        mongoose.model('user').find({ user: req.query.learner }, (err, lrn) => {
            if(err||!lrn){
                return res.status(400).send('noUsr')
            }
            const hasLesson = !!req.user.teaching.filter(q => q.user == req.query.learner).length;
            if (!hasLesson) {
                return res.status(400).send({ status: 'noLesson' })
            }
            req.user.outMsgs.push({
                to:req.query.learner,
                msg:`Hi, ${req.query.learner}! Teacher ${req.user.user} wants to connect about one of the lessons you're teaching!`,
                date:Date.now()
            })
            lrn.inMsgs.push({
                from:req.query.learner,
                msg:`Hi, ${req.query.learner}! Teacher ${req.user.user} wants to connect about one of the lessons you're teaching!`,
                date:Date.now()
            })
            lrn.save();
            req.user.save((err,usv)=>{
                res.send(usv);
            })
        })
    })
    router.get('/toggleFinished', this.authbit, (req, res, next) => {
        //switch the lesson from ongoing ('active==true') to done ('active==false')
        const theLesson = req.user.teaching.filter(q => q._id == req.query.id);
        if (!theLesson) {
            return res.status(400).send('err');//cannot toggle non-existent lesson!
        }
        theLesson.active = !theLesson.active;
        res.user.save((err, usv) => {
            res.send(usv);
        })
    })
    return router;
};

module.exports = routeExp;