const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    isMod = (req, res, next) => {
        console.log('passport', req.session.passport);
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
                        req.user = usv;
                        next();
                    });
                } else {
                    res.status(403).send('err');
                }
            });
        }
    };
    router.get('/topic',this.authbit,(req,res,next)=>{
        mongoose.model('topic').find({},(err,tps)=>{
            res.send(tps);
        })
        // res.send('not implemented! searched for '+req.query.q);
    })
    router.post('/topic',this.authbit,(req,res,next)=>{
        // console.log('triggered topic add route')
        if(!req.body||!req.body.title){
            return res.status(400).send('err')
        }
        const ciTi = new RegExp(req.body.title,'i')
        mongoose.model('topic').find({title:ciTi},function(err,ae){
            if(err||ae.length){
                return res.status(400).send('duplicate');
            }
            mongoose.model('topic').create({
                title:req.body.title,
                desc:req.body.desc||null
            },function(err,resp){
                console.log('Done!',resp)
                res.send('done')
            });
        })
        // res.send('DONE')
    })
    return router;
};

module.exports = routeExp;