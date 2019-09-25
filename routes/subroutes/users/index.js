const express = require('express');
const router = express.Router(),
    path = require('path'),
    models = require('../../../models/'),
    _ = require('lodash'),
    maxAttempts = 10,
    mongoose = require('mongoose'),
    passport = require('passport'),
    axios = require('axios'),
    remark = require('remark'),
    strip = require('strip-markdown'),
    fs = require('fs'),
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

// const oldUsers = JSON.parse(fs.readFileSync('oldUsers.json', 'utf-8'))
let sgApi;
if (fs.existsSync('sparky.json')) {
    sparkyConf = JSON.parse(fs.readFileSync('sparky.json', 'utf-8'));
} else {
    sparkyConf = {
        SPARKPOST_API_KEY: process.env.SPARKPOST_API_KEY,
        SPARKPOST_API_URL: process.env.SPARKPOST_API_URL,
        SPARKPOST_SANDBOX_DOMAIN: process.env.SPARKPOST_SANDBOX_DOMAIN,
        SPARKPOST_SMTP_HOST: process.env.SPARKPOST_SMTP_HOST,
        SPARKPOST_SMTP_PASSWORD: process.env.SPARKPOST_SMTP_PASSWORD,
        SPARKPOST_SMTP_PORT: process.env.SPARKPOST_SMTP_PORT,
        SPARKPOST_SMTP_USERNAME: process.env.SPARKPOST_SMTP_USERNAME,
        SENDGRID_API: process.env.SENDGRID_API
    };
}
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(sparkyConf.SENDGRID_API);


const routeExp = function (io, pp) {
    this.authbit = (req, res, next) => {
        if (!req.session || !req.session.passport || !req.session.passport.user) {
            //no passport userid
            res.status(401).send('err');
        } else {
            mongoose.model('User').findOne({
                _id: req.session.passport.user
            }, function (err, usr) {
                // console.log(err, usr)
                if (!err && usr && !usr.isBanned && !usr.locked) {
                    usr.lastAction = Date.now();
                    usr.save((errsv, usv) => {
                        // truncus('after auth and LA update, usr is',usv)
                        // console.log('USER UPDATED AT', usr.lastAction)
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
    //login/acct creation
    router.post('/new', function (req, res, next) {
        passport.authenticate('local-signup', function (err, user, info) {
            // truncus('err', err, 'usr', user, 'inf', info)
            if (err) {
                return res.status(400).send(err);
            }
            res.send('done');
        })(req, res, next);
    });
    router.post('/login', function (req, res, next) {
        console.log('req.body', req.body);
        if (!req.body || !req.body.pass || !req.body.user) {
            return res.send(false);
        }
        passport.authenticate('local-login', function (err, uObj, info) {
            let usr = uObj.u;
            console.log('err', err, 'usr IS', usr, 'inf', info, 'pass candidate', req.body.pass, 'correct?');
            if (!info) {
                //wrong un/pwd combo
                mongoose.model('User').findOne({
                    'user': req.body.user
                }, (_err, usrwc) => {
                    if (!usrwc || usrwc.wrongAttempts < maxAttempts) {
                        return res.send(false);
                    }
                    usrwc.wrongAttempts = 0;
                    usrwc.locked = true; //too many incorrect attempts; lock account & wait for teacher;
                    refStu();
                    usrwc.save((_erru, _svu) => {
                        return res.status(403).send('banned');
                    });
                });
            } else {
                // const correctSchool = (usr.school === null || usr.school == config.MATHAPP_SCHOOL);
                if (usr && !usr.isBanned && !usr.locked) {
                    req.session.passport = {
                        user: usr._id
                    };
                    const lastNews = fs.readFileSync('./news.txt', 'utf8').split(/\n/);
                    // console.log(fs.lstatSync('./news.txt'))
                    let news = null;
                    let mtime = new Date(fs.lstatSync('./news.txt').mtime).getTime();
                    // const prevLog = usr.lastLogin || 0;
                    // const prevLog = 0
                    console.log('TIME DIF: latest news time', mtime, 'last login was', uObj.oll, 'dif is', mtime - uObj.oll, 'Now is', Date.now());
                    if ((mtime - uObj.oll) > 1000) {
                        news = lastNews.map(d => d.replace(/\r/, ''));
                    }
                    usr.pass = null;
                    usr.salt = null;
                    res.send({
                        usr: usr,
                        news: news,
                    });
                }
                if (usr.isBanned) {
                    return res.status(403).send('banned');
                } else if (usr.locked) {
                    return res.status(403).send('locked');
                }
            }
        })(req, res, next);
    });
    router.get('/logout', function (req, res, next) {
        /*this function logs out the user. It has no confirmation stuff because
        1) this is on the backend
        2) this assumes the user has ALREADY said "yes", and
        3) logging out doesn't actually really require any credentials (it's logging IN that needs em!)
        */
        console.log('usr sez bai');
        req.session.destroy();
        res.send('logged');
    });
    router.get('/google', passport.authenticate('google-signup', {
        scope: ['profile']
    }));
    router.get('/redir', passport.authenticate('google-signup', {
        failureRedirect: '../login?dup'
    }), (req, res) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (_err, usr) {
            //make sure we're in the right school
            // truncus('USER FOUND VIA REDIRECT:', usr, 'SCHOOL', config.MATHAPP_SCHOOL)
            // truncus('REQ IS',req,'GET REQT')
            // res.send('SEE CONSOLE!')
            res.redirect('../');
        });
    });
    //user duplicate and data stuff
    router.get('/getUsr', this.authbit, (req, res, next) => {
        res.send(req.user);
    });
    router.get('/usrData', this.authbit, function (req, res, next) {
        // console.log('asking for secure(ish) user',req.cleanUsr)
        res.send(req.cleanUsr);
    });
    router.get('/allUsrs', this.authbit, (req, res, next) => {
        let aus = Date.now();
        console.log('Start time for AllUsrs route', aus);
        mongoose.model('User').find({}, function (err, usrs) {
            const badStuff = ['msgs', 'salt', 'googleId', 'pass'],
                usrSend = _.cloneDeep(usrs).map(u => {
                    //we wanna remove all the sensitive info
                    badStuff.forEach(d => {
                        if (u[d]) {
                            u[d] = null;
                        }
                    });
                    return u;
                });
            let aue = Date.now();
            console.log('End time for AllUsrs route', aue + '. Elapsed time', aue - aus)
            res.send(usrSend);
        });
    });
    router.get('/nameOkay', function (req, res, next) {
        mongoose.model('User').find({
            'user': req.query.name
        }, function (err, user) {
            console.log('USER CHECK', user);
            res.send(!user.length);
        });
    });
    //user profile stuff, like interests, etc.    
    router.put('/interests', this.authbit, (req, res, next) => {
        //upsert one or more interests
        //incoming format: array of interests like [{title:'JS',lvl:6,canTeach:bool}]
        if (!req.body || !req.body.length) {
            return res.status(400).send('err');
        }
        req.body.forEach(intr => {
            if (!intr.title) {
                //cannot do anything without a title
                return false;
            }
            let alreadyHaz = req.user.interests.find(q => q.title == intr.title);
            console.log('ALREADY HAZ?',alreadyHaz,'ORIGINAL',intr)
            if (!alreadyHaz) {
                //interest does not already exists, so create it
                //level CAN be zero, if the user is for example interested but has not actually learned about it.
                alreadyHaz = {
                    title: intr.title,
                    lvl: intr.lvl || 0,
                    canTeach: !!intr.canTeach
                }
                req.user.interests.push(alreadyHaz);
            } else {
                //does already exists. update 
                alreadyHaz.lvl = intr.lvl || alreadyHaz.lvl;
                alreadyHaz.canTeach = intr.canTeach||intr.canTeach===false?intr.canTeach:alreadyHaz.canTeach;
            }
        });
        req.user.save((eu, esv) => {
            res.send('done')
        })
    });
    router.get('/interests', this.authbit, (req, res, next) => {
        //get all interests
        res.send(req.user.interests);
    })
    router.delete('/interests', this.authbit, (req, res, next) => {
        //remove interest(s)
        req.user.interests = req.user.interests.filter(q => {
            q.title == req.body.title;
        });
        req.user.save((eu, esv) => {
            res.send('refresh')
        })
    })

    router.get('/changeTz', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.tz = req.query.tz;
            console.log('USER TIME ZONE NOW', usr);
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            });
        });
    });
    router.post('/changeOther', this.authbit, (req, res, next) => {

        req.user.otherInfo = req.body.other;
        usr.save((errsv, usrsv) => {
            res.send(usrsv);
        });

    });
    router.post('/changeAva', this.authbit, (req, res, next) => {
        req.user.avatar = req.body.img;
        console.log('USER NOW', req.body, usr);
        usr.save((errsv, usrsv) => {
            res.send(usrsv);
        });
    });
    router.get('/setEmail', authbit, (req, res, next) => {
        ///(\w+\.*)+@(\w+\.)+\w+/g
        ///(\w+\.*)+@(\w*)(\.\w+)+/g
        if (!req.query.email || !req.query.email.match(/(\w+\.*)+@(\w+\.)+\w+/g) || (req.query.email.match(/(\w+\.*)+@(\w+\.)+\w+/g)[0].length !== req.query.email.length)) {
            res.send('err');
            return false;
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.email = req.query.email;
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            });
        });
    });
    //mod stuff
    router.get('/makeMod', this.authbit, isMod, (req, res, next) => {
        mongoose.model('User').findOneAndUpdate({
            user: req.query.user
        }, {
            $set: {
                mod: true
            }
        }, function (err, nm) {
            mongoose.model('User').find({}, function (err, usrs) {
                const badStuff = ['msgs', 'salt', 'googleId', 'pass'];
                res.send(_.cloneDeep(usrs).map(u => {
                    //we wanna remove all the sensitive info
                    badStuff.forEach(d => {
                        if (u[d]) {
                            delete u[d];
                        }
                    });
                    return u;
                }));
            });
        });
    });
    router.get('/toggleBan', this.authbit, isMod, (req, res, next) => {
        mongoose.model('User').findOne({
            user: req.query.user
        }, function (err, usr) {
            console.log('BANNING', req.query.user, usr);
            usr.isBanned = !usr.isBanned;
            usr.save(function (err, resp) {
                mongoose.model('User').find({}, function (err, usrs) {
                    const badStuff = ['msgs', 'salt', 'googleId', 'pass'];
                    res.send(_.cloneDeep(usrs).map(u => {
                        //we wanna remove all the sensitive info
                        badStuff.forEach(d => {
                            if (u[d]) {
                                delete u[d];
                            }
                        });
                        return u;
                    }));
                });
            });
        });
    });
    //msg stuff
    router.get('/setOneRead', this.authbit, (req, res, next) => {
        if (!req.query.id) {
            res.send('err');
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.inMsgs.filter(m => m._id == req.query.id)[0].read = true;
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            });
        });
    });
    router.get('/setAllRead', this.authbit, (req, res, next) => {
        if (!req.query.id) {
            res.send('err');
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.inMsgs.forEach(m => m.read = true);
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            });
        });
    });
    router.post('/sendMsg', this.authbit, (req, res, next) => {
        //user sends message to other user(s)
        console.log('SEND MSG', req.body);
        //first, let's push this into our outBox
        remark().use(strip).process(req.body.mdMsg, function (err, txt) {
            const rawMsg = String(txt).replace(/($|\\)#/g, '').replace(/\n|\r/g, ' ')
            // console.log('TEXT IS',txtOut)

            req.user.outMsgs.push({
                to: req.body.to,
                date: Date.now(),
                mdMsg: req.body.mdMsg,
                htmlMsg: req.body.htmlMsg,
                rawMsg: rawMsg
            });
            req.user.save((ef, fu) => {
                res.send('refresh')
            });
            const nao = Date.now()
            req.body.to.forEach(tu => {
                //note that we can send the above "done" response before actually submitting our mails
                mongoose.model('User').findOne({
                    user: tu
                }, function (err, tousr) {
                    if (!tousr || err) {
                        //Cannot find this user!
                        return req.user.inMsgs.push({
                            from: 'System',
                            date: nao,
                            msg: '<h3 class="content">Undeliverable Message</h3> The following user cannot be found:<br>' + tu
                        })
                    }
                    tousr.inMsgs.push({
                        from: req.user.user,
                        date: nao,
                        mdMsg: req.body.mdMsg,
                        htmlMsg: req.body.htmlMsg,
                        rawMsg: rawMsg
                    });
                    tousr.save((errt, svt) => {
                        io.emit('refresh', { user: tu })
                    })
                });
            })
        })
    });
    router.get('/delMsg', this.authbit, (req, res, next) => {
        //user deletes an old message sent TO them by user and id. this removes from inbox
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!usr || err) {
                res.send('err');
            } else {
                console.log('USER', usr.user, 'MSGS', usr.inMsgs, 'QUERY', req.query);
                for (var i = 0; i < usr.inMsgs.length; i++) {
                    if (usr.inMsgs[i]._id == req.query.id) {
                        // usr.inMsgs[i].msg +='|FAKE DELETE AT '+Date.now()
                        usr.inMsgs.splice(i, 1);
                        break;
                    }
                }
                usr.save(function (err, usr) {
                    req.user = usr;
                    res.send('refresh');
                });
            }
        });
    });
    router.get('/delMyMsg', this.authbit, (req, res, next) => {
        //user deletes an old message sent FROM them by user and id. This removes from outMsgs
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!usr || err) {
                res.send('err');
            } else {
                for (var i = 0; i < usr.outMsgs.length; i++) {
                    if (usr.outMsgs[i]._id == req.query.id) {
                        usr.outMsgs.splice(i, 1);
                        break;
                    }
                }
                usr.save(function (err, usr) {
                    req.user = usr;
                    res.send(usr);
                });
            }
        });
    });
    router.post('/repMsg', this.authbit, (req, res, next) => {
        //sends a message to all users flagged as 'mods' with message body, to, from
        const theMsg = req.user.inMsgs.filter(m => m._id == req.body._id)[0];
        if (theMsg.isRep) {
            return res.send('dupRep');
        }
        // console.log(theMsg, '---THE MSG');
        theMsg.isRep = true;
        // console.log('REPORTING MESSAGE', req.body);
        req.user.save((errfrm, usrfrm) => {
            // console.log('Saved FROM report', usrfrm, errfrm, 'ORIGINAL USER REPORTING', usr, 'END USER REPING');
            res.send('refresh')
        });
        // throw new Error('err!')
        mongoose.model('User').find({
            mod: true
        }, (err, mods) => {
            //send to each of the mods
            mods.forEach(mod => {
                mod.inMsgs.push({
                    from: 'System',
                    msg: `<h3>Reported Message</h3>
                    <br>Date:${new Date(req.body.date).toLocaleString()}
                    <br>From:${req.body.from}
                    <br>To:${req.user.user}
                    <br>Message:${req.body.msg}`,
                    date: Date.now()
                });
                io.emit('refresh', { user: mod.user })
                mod.save();
            });
            //now find on the SENT (outMsgs) of sending user
            mongoose.model('User').findOne({
                user: req.body.from
            }, (ferr, fusr) => {
                let repd = fusr.outMsgs.filter(orp => orp.msgId == theMsg.msgId)[0];
                console.log(repd, fusr);
                repd.isRep = true;
                fusr.save((oerr, ousr) => {
                    io.emit('refresh', { user: fusr.user })
                });
            });
        });
    });
    //password stuff    
    router.post('/editPwd', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (usr && usr.correctPassword(req.body.old) && req.body.pwd == req.body.pwdDup) {
                console.log('got correct pwd, changing!');
                usr.salt = mongoose.model('User').generateSalt();
                usr.pass = mongoose.model('User').encryptPassword(req.body.pwd, usr.salt);
                usr.save((err, usrsv) => {
                    res.send(usrsv);
                });
            } else {
                res.send('err');
            }
        });
    });
    router.post('/forgot', function (req, res, next) {
        //user enters password, requests reset email
        //this IS call-able without credentials, but
        //as all it does is send out a reset email, this
        //shouldn't be an issue
        mongoose.model('User').findOne({
            user: req.body.user
        }, function (err, usr) {
            console.log(err, usr, req.body);
            if (!usr || err) {
                res.send('err');
                return;
            } else {
                let jrrToken = Math.floor(Math.random() * 99999).toString(32);
                for (let i = 0; i < 15; i++) {
                    jrrToken += Math.floor(Math.random() * 99999).toString(32);
                }
                if (!usr.email) {
                    res.send('err');
                    return false;
                }
                console.log(jrrToken);
                //req.protocol,req.get('host')
                const resetUrl = req.protocol + '://' + req.get('host') + '/user/reset?key=' + jrrToken;
                usr.reset = jrrToken;
                usr.save(function () {
                    const msg = {
                        to: usr.email,
                        from: 'no-reply@codementormatch.herokuapp.com',
                        subject: 'Password Reset',
                        text: 'Someone (hopefully you!) requested a reset email for your CodeMentorMatch account. If you did not request this, just ignore this email. Otherwise, go to ' + resetUrl + '!',
                        html: 'Someone (hopefully you!) requested a reset email for your CodeMentorMatch account. <br>If you did not request this, just ignore this email.<br>Otherwise, click <a href="' + resetUrl + '">here</a>',
                    };
                    sgMail.send(msg);
                    res.end('done');
                });
            }
        });
    });
    router.get('/reset', function (req, res, next) {
        //trying to get reset page using req.query. incorrect token leads to resetFail
        const rst = req.query.key;
        if (!rst) {
            console.log('NO KEY!');
            res.sendFile('resetFail.html', {
                root: './views'
            });
        } else {
            mongoose.model('User').findOne({
                reset: rst
            }, function (err, usr) {
                if (err || !usr) {
                    console.log('NO USER!');
                    res.sendFile('resetFail.html', {
                        root: './views'
                    });
                }
                res.sendFile('reset.html', {
                    root: './views'
                });
            });
        }
    });
    router.get('/resetUsr', function (req, res, next) {
        // get user info by key for the reset.html page
        const rst = req.query.key;
        if (!rst) {
            res.send('err');
        } else {
            console.log('lookin for key:', rst);
            mongoose.model('User').findOne({
                reset: rst
            }, function (err, usr) {
                if (err || !usr) {
                    res.send('err');
                } else {
                    res.send(usr);
                }
            });
        }
    });
    router.post('/resetPwd/', function (req, res, next) {
        if (!req.body.acct || !req.body.pwd || !req.body.key || !req.body.pwdDup || (req.body.pwdDup != req.body.pwd)) {
            res.send('err');
        } else {
            mongoose.model('User').findOne({
                reset: req.body.key
            }, function (err, usr) {
                if (err || !usr || usr.user !== req.body.acct) {
                    res.send('err');
                } else {
                    console.log('usr before set:', usr);
                    // usr.setPassword(req.body.pwd, function() {
                    usr.salt = mongoose.model('User').generateSalt();
                    usr.pass = mongoose.model('User').encryptPassword(req.body.pwd, usr.salt);
                    console.log('usr after set:', usr);
                    // usr.reset = null;
                    usr.save();
                    res.send('done');
                    // });
                }
            });
        }
    });
    //rating
    router.put('/rate', this.authbit, (req, res, next) => {
        //add rating
        //for this, we need a teacher to rate, and a lesson that involves both these two.
        //note that I was originally planning to only have completed (active==false) lessons rateable, but that doesnt really make sense if the teacher doesn't end the lesson (i.e., goes AWOL)
        if (!req.body || !req.body.teacher || !req.body.rateNum) {
            return res.status(400).send({
                status: 'missingRateData'
            });
        }
        mongoose.model('user').find({ user: req.body.teacher }, (err, tc) => {
            if (err || !tc) {
                return res.status(400).send({
                    status: 'noTeacher'
                });
            }
            const hasLessons = !!tc.teaching.filter(q => q.user == req.user.user).length;
            if (!hasLessons) {
                //user has not taken any lessons with this teacher. Cannot rate a teacher you've not 'experienced'!
                return res.status(400).send({
                    status: 'noLessons'
                });
            }
            const hasRating = tc.ratings.find(q => q.rateUsr == req.user.user);
            if (hasRating) {
                //if this user has already rated this teacher, simply change their rating
                hasRating.rateNum = req.body.rateNum;
                hasRating.rateText = req.body.rateText || hasRating.rateText || null;
                hasRating.hideName = !!req.body.hideName;
            } else {
                tc.ratings.push({
                    rateUsr: req.user.user,
                    rateNum: Math.min(5, Math.max(0, req.body.rateNum)),
                    rateText: req.body.rateText || null,
                    hideName: !!req.body.hideName
                });
            }
            tc.save((err, usv) => {
                res.send('done');
            })
        })
    })
    router.delete('/rating', this.authbit, (req, res, next) => {
        //remove a rating
        if (!req.body || !req.body.teacher) {
            return res.status(400).send('noTeacher');
        }
        mongoose.model('user').find({ user: req.body.teacher }, (err, tc) => {
            if (err || !tc) {
                return res.status(400).send('noTeacher');
            }
            const theRating = tc.ratings.find(q => q.rateUsr == req.user.user);
            if (!theRating) {
                return res.status(400).send('noRating');
            }
            tc.ratings = tc.ratings.filter(q => q.rateUsr != req.user.user);
            tc.save();
            res.send('done');
        })
    })
    router.get('/rating', this.authbit, (req, res, next) => {
        //get the ratings + calculated avg for this user
        if (!req.body || !req.body.usr) {
            return res.status(400).send('noTeacher');
        }
        mongoose.model('user').find({ user: req.body.usr }, (err, ru) => {
            if (err || !ru) {
                return res.status(400).send('noUsr');
            }
            const rateObj = {
                msg: null,
                ratings: null,
                stars: null
            }
            if (!ru.ratings.length) {
                rateObj.msg = `No ratings have yet been submitted for this person! Please note that only active or previous students can rate!`
                rateObj.stars = null;
            } else {
                rateObj.msg = 'Here are the following ratings for this person';
                rateObj.ratings = ru.ratings.map(q => ({
                    num: q.rateNum,
                    desc: q.rateText || '(None)',
                    user: !q.hideName && q.rateUsr
                }));
                let rateSum = 0,
                    rateCount = 0;
                rateObj.ratings.forEach(roi => {
                    rateCount++;
                    rateSum += roi.rateNum
                });
                rateObj.stars = rateSum / rateCount;
            }
            res.send(rateObj)
        })
    })
    //match stuff
    router.post('/topicSearch', this.authbit, (req, res, next) => {
        //search for a user by list of topic titles. Return users that have ALL of those topics and have the canTeach flag set to true for each topic
        mongoose.model('User').find({}, (err, usrs) => {
            const gudUsrs = usrs.filter(u => {
                const usrCanTeach = u.interests.filter(a => !!a.canTeach);
                console.log('LOOKING at user', u.user, 'WITH INTS', usrCanTeach, 'compared to', req.body, 'Not this user?', req.user.user != u.user)
                // req.body.filter(srchTop=>{
                //     return 
                // })
                return req.user.user != u.user && (!req.body.filter(srchTop => {
                    return !usrCanTeach.find(ut => {
                        console.log('USER', u.user, 'TITLE', srchTop.value, 'TITLE MATCH', ut.title == srchTop.value, 'LVL MATCH', ut.lvl >= srchTop.min)
                        return ut.title.toLowerCase() == srchTop.value.toLowerCase() && ut.lvl >= srchTop.min;
                    })
                    // return !simpUsrInts.includes(a);
                }).length);
            }).map(q => {
                return {
                    company: q.company,
                    user: q.user,
                    interests: q.interests,
                    projects: q.projects,
                    avatar: q.avatar
                }
            })
            res.send(gudUsrs)
        })
    })
    router.put('/connect', this.authbit, (req, res, next) => {
        if (!req.body || !req.body.user || !(req.body.topics && req.body.topics.length)) {
            return res.status(400).send('err');
        }
        mongoose.model('User').findOne({ user: req.body.user }, (err, tu) => {
            if (err || !tu) {
                return res.status(400).send('err');
            }
            console.log('attempting to connect btwn usrs', req.body, 'USER IS', tu, typeof tu, tu.inMsgs);
            // res.send('done');
            const htmlMsg = `Hi ${req.body.displayName || req.body.user}! User ${req.user.displayName || req.user.user} wants a mentor for the following topics!<br><ul>${req.body.topics.map(q => {
                return '<li>' + q + '</li>';
            })}</ul><br>Go ahead and reply back to connect with them!`,

                mdMsg = `Hi ${req.body.displayName || req.body.user}! User ${req.user.displayName || req.user.user} wants to a mentor for the following topics!\n
            ${req.body.topics.map(q => {
                    return ' - ' + q;
                })}`;
            req.user.outMsgs.push({
                to: req.body.displayName || req.body.user,
                date: Date.now(),
                htmlMsg: htmlMsg,
                rawMsg: `User ${req.user.displayName || req.user.user} wants to connect!`,
                mdMsg: mdMsg
            });
            console.log('TO USE INMSG', tu.inMsg, 'of', tu.user)
            tu.inMsgs.push({
                from: req.user.displayName || req.user.user,
                date: Date.now(),
                htmlMsg: htmlMsg,
                rawMsg: `User ${req.user.displayName || req.user.user} wants to connect!`,
                mdMsg: mdMsg
            })
            tu.save();
            req.user.save((ef, uf) => {
                res.send('refresh')
            })
        })
    })
    router.get('/ref', this.authbit, (req, res, next) => {
        res.send('refresh');
    })

    //TEMPORARY!

    router.get('/tempAddTeachTop', this.authbit, (req, res, next) => {
        req.user.teachTopics.push({ title: req.query.t, lvl: Math.ceil(Math.random() * 10) })
        req.user.save();
        res.send('done');
    })
    router.get('/temp',(req,res,next)=>{
        res.send('Random number: '+Math.floor(Math.random()*100));
    })
    router.get('/wipeMail', (req, res, next) => {
        mongoose.model('User').find({}, (err, usrs) => {
            usrs.forEach(u => {
                u.inMsgs = [];
                u.outMsgs = [];
                u.save();
            })
            res.send('DONE');
        })
    })
    return router;
};

module.exports = routeExp;