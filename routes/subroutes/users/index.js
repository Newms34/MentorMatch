const express = require('express');
const router = express.Router(),
    path = require('path'),
    models = require('../../../models/'),
    _ = require('lodash'),
    maxAttempts = 10,
    mongoose = require('mongoose'),
    uuid = require('uuid'),
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
    },
    demoNames = {
        animals: ['dog', 'fish', 'cat', 'horse', 'bird', 'lizard', 'turtle', 'spider', 'mouse', 'hamster', 'frog'],
        adjectives: ['lumpy', 'large', 'small', 'ferocious', 'tiny', 'friendly', 'dignified', 'superior', 'humble']
    };

// const oldUsers = JSON.parse(fs.readFileSync('oldUsers.json', 'utf-8'))
let sgApi;
mongoose.Promise = Promise;
if (fs.existsSync('./config/sparky.json')) {
    sparkyConf = JSON.parse(fs.readFileSync('./config/sparky.json', 'utf-8'));
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
    this.findUserNames = (param) => {
        return function (req, res, next) {
            console.log('incoming data to findUserNames', req.body, param);
            if (!req.body || !req.body[param] || !req.body[param].length) {
                return next();//cannot find param, so just run Next
            }
            const usrProms = req.body[param].map(q => {
                // console.log('Trying to find user to match:', q)
                return mongoose.model('User').findOne({
                    $or: [{ user: q }, { displayName: q }]
                });
            });
            Promise.all(usrProms).then(r => {
                // console.log(r)
                req.body.users = r.map(a => ({ user: a.user, displayName: a.displayName }));
                next();
            });
        };
    };
    router.post('/testRoute', this.findUserNames('derp'), (req, res, next) => {
        console.log(req.body);
        res.send('done!');
    });
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
        if (!req.body || !req.body.pass || !req.body.user) {
            return res.send(false);
        }
        passport.authenticate('local-login', function (err, uObj, info) {
            let usr = uObj.u;
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
                    console.log('TIME DIF: latest news time', mtime, 'last login was', usr.oldLastLogin, 'dif is', mtime - usr.oldLastLogin, 'Now is', Date.now());
                    if ((mtime - usr.oldLastLogin) > 1000) {
                        news = lastNews.map(d => d.replace(/\r/, ''));
                    }
                    usr.pass = null;
                    usr.salt = null;
                    const clUsr = JSON.parse(JSON.stringify(usr));
                    delete clUsr.pass;
                    delete clUsr.salt;
                    res.send({
                        usr: clUsr,
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
            console.log('End time for AllUsrs route', aue + '. Elapsed time', aue - aus);
            res.send(usrSend);
        });
    });
    router.get('/nameOkay', function (req, res, next) {
        mongoose.model('User').find({ $or: [{ user: req.query.name }, { displayName: req.query.name }] }, function (err, user) {
            console.log('USER CHECK', user);
            res.send(!user.length);
        });
    });
    //user profile stuff, like interests, etc.    
    //inchrests
    router.put('/interests', this.authbit, (req, res, next) => {
        //upsert one or more interests
        //incoming format: array of interests like [{title:'JS',lvl:6,canTeach:bool}]
        console.log('INCOMING INTERESTS ARR', req.body);
        if (!req.body || !req.body.length) {
            return res.status(400).send('err');
        }
        req.body.forEach(intr => {
            if (!intr.title) {
                //cannot do anything without a title
                return false;
            }
            let alreadyHaz = req.user.interests.find(q => q.title == intr.title);
            console.log('ALREADY HAZ?', alreadyHaz, 'ORIGINAL', intr);
            if (!alreadyHaz) {
                //interest does not already exists, so create it
                //level CAN be zero, if the user is for example interested but has not actually learned about it.
                alreadyHaz = {
                    title: intr.title,
                    lvl: intr.lvl || 0,
                    canTeach: !!intr.canTeach
                };
                req.user.interests.push(alreadyHaz);
            } else {
                //does already exists. update 
                alreadyHaz.lvl = intr.lvl || alreadyHaz.lvl;
                alreadyHaz.canTeach = intr.canTeach || intr.canTeach === false ? intr.canTeach : alreadyHaz.canTeach;
            }
        });
        req.user.save((eu, esv) => {
            io.emit('topicUpdate', {});
            res.send('done');
        });
    });
    router.get('/interests', this.authbit, (req, res, next) => {
        //get all interests
        res.send(req.user.interests);
    });
    router.delete('/interests', this.authbit, (req, res, next) => {
        //remove interest(s)
        // console.log('WOULD ATTEMPT TO DELETE ',req.query.t)
        // return res.send('NO');
        req.user.interests = req.user.interests.filter(q => {
            return q.title != req.query.t;
        });
        req.user.save((eu, esv) => {
            res.send('refresh');
        });
    });

    //projs
    router.put('/projs', this.authbit, (req, res, next) => {
        //upsert one or more interests
        if (!req.body || !req.body.length) {
            return res.status(400).send('err');
        }
        req.body.forEach(proj => {
            if (!proj.name) {
                //cannot do anything without a name
                return false;
            }
            let alreadyHaz = req.user.projects.find(q => q.name == proj.name);
            console.log('ALREADY HAZ?', alreadyHaz, 'ORIGINAL', proj);
            if (!alreadyHaz) {
                //project does not already exists, so create it
                //level CAN be zero, if the user is for example projected but has not actually learned about it.
                alreadyHaz = {
                    name: proj.name,
                    description: proj.description || null,
                    position: proj.position || null
                };
                req.user.projects.push(alreadyHaz);
            } else {
                //does already exists. update 
                alreadyHaz.description = proj.description;
                alreadyHaz.position = proj.position;
            }
        });
        req.user.save((eu, esv) => {
            res.send('refresh');
        });
    });
    router.get('/projs', this.authbit, (req, res, next) => {
        //get all interests
        res.send(req.user.projects);
    });
    router.delete('/projs', this.authbit, (req, res, next) => {
        //remove interest(s)
        req.user.projects = req.user.projects.filter(q => q.name == req.body.name);
        req.user.save((eu, esv) => {
            res.send('refresh');
        });
    });

    router.post('/changeOther', this.authbit, (req, res, next) => {
        //NEED TO IMPLEMENT
        // req.user.otherInfo = req.body.other;
        // console.log('INCOMING USER',req.body)
        if (req.body.displayName && req.body.displayName != req.user.displayName) {
            //changed display name; we need to check if this name is okay
            mongoose.model('User').findOne({ $or: [{ user: req.body.displayName }, { displayName: req.body.displayName }] }, (err, usr) => {
                if (usr && usr.user != req.user.user) {
                    return res.status(400).send('dupDisplay');
                }
                ['company', 'projects', 'otherInfo', 'displayName', 'avatar', 'gitLink'].forEach(n => {
                    if (n == 'projects' && !req.body[n].length) {
                        return false;
                    }

                    console.log('Old', n, 'was', req.user[n], 'new', req.body[n], 'replace?', !!req.body[n]);
                    req.user[n] = req.body[n];
                });
                req.user.save((errsv, usrsv) => {
                    res.send('refresh');
                });
            });
        } else {
            ['company', 'projects', 'otherInfo', 'displayName', 'avatar', 'gitLink'].forEach(n => {
                if (n == 'projects' && !req.body[n].length) {
                    return false;
                }

                console.log('Old', n, 'was', req.user[n], 'new', req.body[n], 'replace?', !!req.body[n]);
                req.user[n] = req.body[n];
            });

            req.user.save((errsv, usrsv) => {
                res.send('refresh');
            });
        }

    });
    router.post('/changeAva', this.authbit, (req, res, next) => {
        req.user.avatar = req.body.img;
        // console.log('USER NOW', req.body, usr);
        req.user.save((errsv, usrsv) => {
            res.send('refresh');
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
    //note that there is NO reply route; replies are generated on the front end, and are treated here as just regular messages
    router.get('/setOneRead', this.authbit, (req, res, next) => {
        if (!req.query.msgId || !req.user.inMsgs.find(m => m.msgId == req.query.msgId)) {
            res.status(400).send('err');
        }
        req.user.inMsgs.find(m => m.msgId == req.query.msgId).read = true;
        req.user.save((errsv, usrsv) => {
            res.send(usrsv);
        });
    });
    router.get('/setAllRead', this.authbit, (req, res, next) => {
        req.user.inMsgs.forEach(m => m.read = true);
        req.user.save((errsv, usrsv) => {
            res.send(usrsv);
        });
    });
    router.post('/sendMsg', this.findUserNames('to'), this.authbit, (req, res, next) => {
        //user sends message to other user(s)
        console.log('SEND MSG', req.body);
        //first, let's push this into our outBox
        remark().use(strip).process(req.body.mdMsg, function (err, txt) {
            const rawMsg = String(txt).replace(/($|\\)#/g, '').replace(/\n|\r/g, ' ');
            // console.log('TEXT IS',txtOut)
            const msgId = uuid.v4();
            req.user.outMsgs.push({
                to: req.body.users,
                date: Date.now(),
                mdMsg: req.body.mdMsg,
                htmlMsg: req.body.htmlMsg,
                rawMsg: rawMsg,
                msgId: msgId
            });
            req.user.save((ef, fu) => {
                res.send('refresh');
            });
            const nao = Date.now();
            req.body.users.forEach(tu => {
                //note that we can send the above "done" response before actually submitting our mails
                mongoose.model('User').findOne({
                    user: tu.user
                }, function (err, tousr) {
                    if (!tousr || err) {
                        //Cannot find this user!
                        req.user.inMsgs.push({
                            from: { user: 'System', displayName: null },
                            date: nao,
                            msg: '<h3 class="content">Undeliverable Message</h3> The following user cannot be found:<br>' + tu
                        });
                        return req.user.save((ef, fu) => {
                            io.emit('refresh', { user: req.user.user });
                        });
                    }
                    tousr.inMsgs.push({
                        from: { user: req.user.user, displayName: req.user.displayName },
                        date: nao,
                        mdMsg: req.body.mdMsg,
                        htmlMsg: req.body.htmlMsg,
                        rawMsg: rawMsg,
                        msgId: msgId
                    });
                    tousr.save((errt, svt) => {
                        io.emit('refresh', { user: tu });
                    });
                });
            });
        });
    });
    router.get('/delMsg', this.authbit, (req, res, next) => {
        //user deletes an old message sent TO them by user and id. this removes from inbox
        req.user.inMsgs = req.user.inMsgs.filter(q => q.msgId != req.query.msgId);
        console.log('Ran route to delete Inbox msgs. msg id was', req.query.msgId, 'and msg list now', req.user.inMsgs);
        req.user.save((a, b) => {
            res.send('refresh');
        });
    });
    router.get('/delMyMsg', this.authbit, (req, res, next) => {
        //user deletes an old message sent FROM them by user and id. This removes from outMsgs
        req.user.outMsgs = req.user.outMsgs.filter(q => q.msgId != req.query.msgId);
        console.log('Ran route to delete Outbox msgs. msg id was', req.query.msgId, 'and msg list now', req.user.outMsgs);
        req.user.save((a, b) => {
            res.send('refresh');
        });
    });
    router.post('/repMsg', this.authbit, (req, res, next) => {
        //report, not reply!
        //sends a message to all users flagged as 'mods' with message body, to, from
        const theMsg = req.user.inMsgs.find(m => m.msgId == req.body.msgId);
        if (theMsg.isRep) {
            return res.send('dupRep');
        }
        // console.log(theMsg, '---THE MSG');
        theMsg.isRep = true;
        // console.log('REPORTING MESSAGE', req.body);
        req.user.save((errfrm, usrfrm) => {
            // console.log('Saved FROM report', usrfrm, errfrm, 'ORIGINAL USER REPORTING', usr, 'END USER REPING');
            res.send('refresh');
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
                    date: Date.now(),
                    msgId: req.body.msgId
                });
                io.emit('refresh', { user: mod.user });
                mod.save();
            });
            //now find on the SENT (outMsgs) of sending user
            mongoose.model('User').findOne({
                user: req.body.from
            }, (ferr, fusr) => {
                let repd = fusr.outMsgs.find(orp => orp.msgId == theMsg.msgId);
                console.log(repd, fusr);
                repd.isRep = true;
                fusr.save((oerr, ousr) => {
                    io.emit('refresh', { user: fusr.user });
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
        //user enters username, requests reset email
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
                let jrrToken = uuid.v1();
                for (let i = 0; i < 15; i++) {
                    jrrToken += uuid.v4();
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
                if (err) {
                    res.status(400).send('err');
                } else if (!usr) {
                    res.status(400).send('noUsr');
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
    //ratings/reviews

    router.get('/review', this.authbit, (req, res, next) => {
        //get ONE review by teacher. this route is used to see if we're replacing a review or writing a new one, and is from the STUDENT who's reviewing that teacher
        mongoose.model('User').findOne({ $or: [{ user: req.query.tch }, { displayName: req.query.tch }] }, function (err, tc) {
            if (err || !tc) {
                return res.status(400).send('err');
            }
            console.log('tch', tc);
            const oldReview = tc.ratings.find(q => q.rateUsr && q.rateUsr.user == req.user.user);
            res.send(oldReview);
        });
        // res.send(false)
    });
    router.put('/review', this.authbit, (req, res, next) => {
        //upsert review
        //note that rateNum, the number of stars, is from 0 to 5
        //for this, we need a teacher to rate, and a lesson that involves both these two.
        //note that I was originally planning to only have completed (active==false) lessons rateable, but that doesnt really make sense if the teacher doesn't end the lesson (i.e., goes AWOL)
        if (!req.body || !req.body.tch || !req.body.rateNum) {
            return res.status(400).send({
                status: 'missingRateData'
            });
        }

        mongoose.model('User').findOne({ $or: [{ user: req.body.tch.user }, { displayName: req.body.tch.displayName }] }, (err, tc) => {
            if (err || !tc) {
                return res.status(400).send({
                    status: 'noTeacher'
                });
            }
            const hasLesson = tc.teaching.find(q => q.user.user == req.user.user);

            console.log('TEACHING', tc.teaching, '. ATTEMPTED TO FIND LESSON FROM THIS USR:', hasLesson, req.user.user);
            if (!hasLesson) {
                //user has not taken any lessons with this teacher. Cannot rate a teacher you've not 'experienced'!
                return res.status(400).send({
                    status: 'noLessons'
                });
            }
            // return res.send('STOP')
            const hasRating = tc.ratings.find(q => q.rateUsr.user == req.user.user);
            if (hasRating) {
                //if this user has already rated this teacher, simply change their rating
                hasRating.rateNum = req.body.rateNum;
                hasRating.rateText = req.body.rateText;
                hasRating.hideName = !!req.body.hideName;
            } else {
                tc.ratings.push({
                    rateUsr: { user: req.user.user, displayName: req.user.displayName },
                    rateNum: Math.min(5, Math.max(0, req.body.rateNum)),
                    rateText: req.body.rateText || null,
                    hideName: !!req.body.hideName
                });
            }
            // console.log('TC RATINGS', tc.ratings)
            tc.save((err, usv) => {
                io.emit('refresh', { user: tc.user });
                res.send({ err: err, usv: usv });
            });
        });
    });
    router.delete('/review', this.authbit, (req, res, next) => {
        //remove a rating
        if (!req.body || !req.body.tch) {
            return res.status(400).send('noTeacher');
        }
        mongoose.model('user').findOne({ $or: [{ user: req.body.tch.user }, { displayName: req.body.tch.displayName }] }, (err, tc) => {
            if (err || !tc) {
                return res.status(400).send('noTeacher');
            }
            const theRating = tc.ratings.find(q => q.rateUsr.user == req.user.user);
            if (!theRating) {
                return res.status(400).send('noRating');
            }
            tc.ratings = tc.ratings.filter(q => q.rateUsr.user != req.user.user);
            tc.save((a, b) => {
                io.emit('refresh', { user: tc.user });
                res.send('done');
            });
        });
    });
    router.post('/reviews', this.authbit, (req, res, next) => {
        //get the ratings + calculated avg for this user
        if (!req.body || !req.body.tch) {
            return res.status(400).send('noTeacher');
        }
        //we COULD use req.user here, but this will also be used for other accounts to see this user's reviews. IOW, if a student wants to see a teacher's reviews before applying to take a course from them
        mongoose.model('User').findOne({ $or: [{ user: req.body.tch.user }, { displayName: req.body.tch.displayName }] }, (err, ru) => {
            if (err || !ru) {
                return res.status(400).send('noUsr');
            }
            const rateObj = {
                msg: null,
                ratings: [],
                stars: null
            };
            if (!ru.ratings.length) {
                rateObj.msg = `No ratings have yet been submitted for this person! Please note that only active or previous students can rate!`;
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
                    rateSum += roi.num;
                });
                rateObj.stars = rateSum / rateCount;
            }
            res.send(rateObj);
        });
    });

    //match stuff
    router.post('/topicSearch', this.authbit, (req, res, next) => {
        //search for a user by list of topic titles. Return users that have ALL of those topics and have the canTeach flag set to true for each topic
        mongoose.model('User').find({}, (err, usrs) => {
            const gudUsrs = usrs.filter(u => {
                const usrCanTeach = u.interests.filter(a => !!a.canTeach);
                console.log('LOOKING at user', u.user, 'WITH INTS', usrCanTeach, 'compared to', req.body, 'Not this user?', req.user.user != u.user);
                // req.body.filter(srchTop=>{
                //     return 
                // })
                return req.user.user != u.user && (!req.body.filter(srchTop => {
                    return !usrCanTeach.find(ut => {
                        console.log('USER', u.user, 'TITLE', srchTop.value, 'TITLE MATCH', ut.title == srchTop.value, 'LVL MATCH', ut.lvl >= srchTop.min);
                        return ut.title.toLowerCase() == srchTop.value.toLowerCase() && ut.lvl >= srchTop.min;
                    });
                    // return !simpUsrInts.includes(a);
                }).length);
            }).map(q => {
                return {
                    company: q.company,
                    user: q.user,
                    interests: q.interests,
                    projects: q.projects,
                    avatar: q.avatar,
                    displayName: q.displayName || null,
                    gitLink: q.gitLink || null,
                    teaching: q.teaching,
                    reviews: q.ratings,
                    isDemoUser: !!q.isDemoUser
                };
            });
            res.send(gudUsrs);
        });
    });
    router.put('/connect', this.authbit, (req, res, next) => {
        if (!req.body || !req.body.user || !(req.body.topics && req.body.topics.length)) {
            return res.status(400).send('err');
        }
        mongoose.model('User').findOne({ user: req.body.user }, (err, tu) => {
            if (err || !tu) {
                return res.status(400).send('err');
            }
            const msgId = uuid.v4();
            console.log('attempting to connect btwn usrs', req.body, 'USER IS', tu, typeof tu, tu.inMsgs);
            // res.send('done');
            const htmlMsg = `Hi ${req.body.displayName || req.body.user}! User ${req.user.displayName || req.user.user} wants a mentor for the following topics!<br><ul>${req.body.topics.map(q => {
                return '<li>' + q + '</li>';
            })}</ul><br>If you're ready to teach, go ahead and click the Teach button below!`,

                mdMsg = `Hi ${req.body.displayName || req.body.user}! User ${req.user.displayName || req.user.user} wants to a mentor for the following topics!\n
            ${req.body.topics.map(q => {
                    return ' - ' + q + '\n';
                })}.\n If you're ready to teach, go ahead and click the Teach button below!`,
                rawMsg = `Hi ${req.body.displayName || req.body.user}! User ${req.user.displayName || req.user.user} wants to a mentor for the following topics! ${req.body.topics.join('')}. If you're ready to teach, go ahead and click the Teach button below!`;
            req.user.outMsgs.push({
                to: [{ user: req.body.user, displayName: req.body.displayName }],
                date: Date.now(),
                htmlMsg: htmlMsg,
                rawMsg: rawMsg,
                mdMsg: mdMsg,
                isConMsg: true,
                topics: req.body.topics,
                msgId: msgId
            });
            tu.inMsgs.push({
                from: { user: req.user.user, displayName: req.user.displayName },
                date: Date.now(),
                htmlMsg: htmlMsg,
                rawMsg: rawMsg,
                mdMsg: mdMsg,
                isConMsg: true,
                topics: req.body.topics,
                msgId: msgId
            });
            tu.save((errt, tsv) => {
                if (errt) {
                    console.log('ERROR WAS', errt);
                }
                io.emit('refresh', { user: tu.user });
            });
            req.user.save((ef, uf) => {
                res.send('refresh');
            });
        });
    });
    router.get('/activeLessons', this.authbit, (req, res, next) => {
        mongoose.model('User').find({}).exec((err, allUsrs) => {
            const hazLesson = allUsrs.map(q => {
                // console.log('checking', q.user, 'vs', req.user.user)
                let lsn = q.teaching.find(a => a.user.user == req.user.user);
                if (q.user != req.user.user && lsn) {
                    lsn = JSON.parse(JSON.stringify(lsn));
                    // console.log('found a lesson by', q.user, 'for', req.user.user)
                    lsn.teacher = { user: q.user, displayName: q.displayName };
                }
                return lsn;
            }).filter(a => !!a);
            res.send(hazLesson);
        });
    });
    router.put('/teach', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            $or: [
                { user: req.body.other.user },
                { displayName: req.body.other.user },
                { user: req.body.other.displayName },
                { displayName: req.body.other.displayName }
            ]
        }, (err, usr) => {
            if (err || !usr) {
                return res.status(400).send('err');
            }
            req.user.teaching.push({
                user: {
                    user: usr.user,
                    displayName: usr.displayName
                },
                topics: req.body.topics
            });
            //we've pushed in that the teacher is teaching. Now we need to update both messages (teacher && student)
            //teacher first
            const msg = req.user.inMsgs.find(q => q.msgId == req.body.msgId);
            msg.htmlMsg = msg.htmlMsg.replace("If you're ready to teach, go ahead and click the Teach button below!", " You've already connected!");
            msg.rawMsg = msg.rawMsg.replace("If you're ready to teach, go ahead and click the Teach button below!", " You've already connected!");
            msg.mdMsg = msg.mdMsg.replace("If you're ready to teach, go ahead and click the Teach button below!", " You've already connected!");
            msg.isConMsg = false;

            //now student
            const stuMsg = usr.outMsgs.find(q => q.msgId == req.body.msgId);
            stuMsg.htmlMsg = stuMsg.htmlMsg.replace("If you're ready to teach, go ahead and click the Teach button below!", " You've already connected!");
            stuMsg.rawMsg = stuMsg.rawMsg.replace("If you're ready to teach, go ahead and click the Teach button below!", " You've already connected!");
            stuMsg.mdMsg = stuMsg.mdMsg.replace("If you're ready to teach, go ahead and click the Teach button below!", " You've already connected!");
            stuMsg.isConMsg = false;
            usr.save((a, b) => {
                io.emit('refresh', { user: usr.user });
            });
            req.user.save((erru, usv) => {
                res.send('refresh');
            });
        });
    });

    //lesson request stuffs
    router.post('/lessonReq', this.authbit, (req, res, next) => {
        const simpTopics = req.body.map(q => q.toLowerCase()).sort();
        mongoose.model('LessonRequest').find({
            user: req.body.user
        }, (err, currLessons) => {
            const dupLsns = currLessons.filter(q => {
                const simpCurrLsnTopics = q.topics.map(a => a.toLowerCase()).sort();
                return simpCurrLsnTopics.join('') == simpTopics.join('');
            });
            if (dupLsns && dupLsns.length) {
                return res.status(400).send('duplicate');
            }
            mongoose.model('LessonRequest').create({
                topics: req.body,
                user: req.user.user,
                displayName: req.user.displayName || null
            }, function (err, nrl) {
                io.emit('refReqLs', {});
                res.send('refresh');
            });
        });
    });
    router.get('/lessonReq', this.authbit, (req, res, next) => {
        mongoose.model('LessonRequest').find({}).exec((err, lsns) => {
            const unqUsrs = _.uniqBy(lsns, 'user').map(q => q.user);
            mongoose.model('User').find({ user: { $in: unqUsrs } }, (erru, rlUsrs) => {
                //now we have all lessons and all users requesting those lessons
                const lsnsWithNumbers = lsns.map(lsn => {
                    const theUsr = rlUsrs.find(a => a.user == lsn.user);
                    console.log('USER FOR THIS TOPIC IS', theUsr.user);
                    const topsWithNumbers = lsn.topics.map(ll => {
                        const theTopicOnUsr = theUsr.interests.find(q => q.title.toLowerCase() == ll.toLowerCase());//find the user instance of this topic, if it exists 
                        // return Math.random()
                        console.log('This topic on user model is', theTopicOnUsr, 'Level is', (!!theTopicOnUsr && theTopicOnUsr.lvl) || 0);
                        console.log('OBJ', {
                            title: ll,
                            lvl: (!!theTopicOnUsr && theTopicOnUsr.lvl) || 0
                        });
                        return {
                            title: ll,
                            lvl: (!!theTopicOnUsr && theTopicOnUsr.lvl) || 0
                        };
                    });
                    console.log('lsn topics now', topsWithNumbers);
                    return {
                        user: lsn.user,
                        displayName: lsn.displayName,
                        answerers: lsn.answerers,
                        topics: topsWithNumbers,
                        _id: lsn._id
                    };
                });
                res.send(lsnsWithNumbers);
            });
            // console.log('UNIQ USERS',unqUsrs,'ALL LSNS',lsns)

        });
    });
    router.delete('/lessonReq', this.authbit, (req, res, next) => {
        mongoose.model('LessonRequest').findOneAndRemove({
            user: req.user.user,
            _id: req.query.id
        }, (err, data) => {
            console.log('REMOVED! Lesson was', data);
            res.send('done');
        });
    });
    router.post('/acceptLesson', this.authbit, (req, res, next) => {
        // console.log('TRYING TO ACCEPT', req.body)
        mongoose.model('LessonRequest').findOne({
            user: req.user.user,
            _id: req.body.id
        }, (erra, alsn) => {
            console.log('ERR', erra, 'ALSN', alsn);
            const htmlMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Student ${req.user.displayName || req.user.user} has accepted your offer to teach them the following skills: <ul>${alsn.topics.map(q => "<li>" + q + "</li>").join('')}</ul><br/>If you're ready to teach, go ahead and click the Teach button below!`,
                mdMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Student ${req.user.displayName || req.user.user} has accepted your offer to teach them the following skills: ${alsn.topics.join(', ')}. If you're ready to teach, go ahead and click the Teach button below!`,
                rawMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Student ${req.user.displayName || req.user.user} has accepted your offer to teach them the following skills: ${alsn.topics.map(q => " - " + q + "\n").join('')}\n If you're ready to teach, go ahead and click the Teach button below!`,
                msgId = uuid.v4();
            mongoose.model('User').findOne({ user: req.body.teacher.user }, (errt, toUsr) => {
                console.log('To User', toUsr && toUsr.user);
                if (!toUsr) {
                    return res.status(400).send('err');
                }
                const nunc = Date.now();
                toUsr.inMsgs.push({
                    from: { user: req.user.user, displayName: req.user.displayName },
                    mdMsg: mdMsg,
                    date: nunc,
                    htmlMsg: htmlMsg,
                    rawMsg: rawMsg,
                    isConMsg: true,
                    topics: alsn.topics,
                    msgId: msgId
                });
                toUsr.save((errt, utsv) => {
                    io.emit('refresh', { user: toUsr.user });
                });
                req.user.outMsgs.push({
                    to: [{ user: req.body.teacher.user, displayName: req.body.teacher.displayName }],
                    displayTo: req.body.displayName,
                    mdMsg: mdMsg,
                    date: nunc,
                    htmlMsg: htmlMsg,
                    rawMsg: rawMsg,
                    isConMsg: true,
                    topics: alsn.topics,
                    msgId: msgId
                });
                req.user.save((errf, svf) => {
                    if (errt) {
                        console.log('ERROR TO', errt);
                    }
                    mongoose.model('LessonRequest').findOneAndRemove({
                        user: req.user.user,
                        _id: req.body.id
                    }, (errr, rlsn) => {
                        io.emit('refresh', { user: toUsr.user });
                        res.send('refresh');
                    });
                });
            });

        });
    });
    router.post('/teachLessonReq', this.authbit, (req, res, next) => {
        mongoose.model('LessonRequest').findOne({
            _id: req.body.id,
        }, (err, lsn) => {
            if (!lsn.answerers.find(q => q.user == req.user.user)) {
                lsn.answerers.push({ user: req.user.user, displayName: req.user.displayName });
            } else {
                lsn.answerers = lsn.answerers.filter(q => q.user != req.user.user);
            }
            lsn.save((errs, rs) => {
                res.send('done');
            });
        });
    });

    //dashboard lesson stuff: request lesson discussion, request lesson end, report lesson.
    router.post('/reqDiscussLesson', this.authbit, (req, res, next) => {
        if (!req.body || !req.body.user || !req.body.teacher) {
            return res.status(400).send('err');
        }
        const topList = req.body.topics.length > 1 ? req.body.topics.slice(0, -1).join(', ') + ' and ' + req.body.topics.slice(-1) : req.body.topics[0],
            mdMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Your student ${req.body.user.displayName || req.body.user.user} wishes to discuss the lesson on \n${req.body.topics.map(q => ' - ' + q + '\n')} Go ahead and reply back to this message!`,
            htmlMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Your student ${req.body.user.displayName || req.body.user.user} wishes to discuss the lesson on <ul>${req.body.topics.map(q => '<li>' + q + '</li>')}</ul><br> Go ahead and reply back to this message!`,
            rawMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Your student ${req.body.user.displayName || req.body.user.user} wishes to discuss the lesson on ${topList}. Go ahead and reply back to this message!`,
            msgId = uuid.v4(), nao = Date.now();
        req.user.outMsgs.push({
            to: [{
                user: req.body.teacher.user,
                displayName: req.body.teacher.displayName
            }],
            mdMsg: mdMsg,
            htmlMsg: htmlMsg,
            rawMsg: rawMsg,
            msgId: msgId,
            date: nao
        });
        mongoose.model('User').findOne({
            $or: [{ user: req.body.teacher.user },
            { displayName: req.body.teacher.displayName }]
        }, (err, usr) => {
            if (!usr) {
                return res.status(400).send('err');
            }
            usr.inMsgs.push({
                from: {
                    user: req.body.user.user,
                    displayName: req.body.user.displayName
                },
                mdMsg: mdMsg,
                htmlMsg: htmlMsg,
                rawMsg: rawMsg,
                msgId: msgId,
                date: nao
            });
            usr.save((a, b) => {
                io.emit('refresh', { user: req.body.teacher.user });
            });
            req.user.save((a, b) => {
                res.send('refresh');
            });
        });
    });

    router.post('/reqEndLesson', this.authbit, (req, res, next) => {
        if (!req.body || !req.body.user || !req.body.teacher) {
            return res.status(400).send('err');
        }
        const topList = req.body.topics.length > 1 ? req.body.topics.slice(0, -1).join(', ') + ' and ' + req.body.topics.slice(-1) : req.body.topics[0],
            mdMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Your student ${req.body.user.displayName || req.body.user.user} wants to end the lesson  \n${req.body.topics.map(q => ' - ' + q + '\n')} If you agree, head over to the Mentoring page and end this lesson.`,
            htmlMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Your student ${req.body.user.displayName || req.body.user.user} wants to end the lesson  <ul>${req.body.topics.map(q => '<li>' + q + '</li>')}</ul><br> If you agree, head over to the Mentoring page and end this lesson.`,
            rawMsg = `Hi ${req.body.teacher.displayName || req.body.teacher.user}! Your student ${req.body.user.displayName || req.body.user.user} wants to end the lesson  ${topList}. If you agree, head over to the Mentoring page and end this lesson.`,
            msgId = uuid.v4();
        req.user.outMsgs.push({
            to: [{
                user: req.body.teacher.user,
                displayName: req.body.teacher.displayName
            }],
            mdMsg: mdMsg,
            htmlMsg: htmlMsg,
            rawMsg: rawMsg,
            msgId: msgId
        });
        mongoose.model('User').findOne({
            $or: [{ user: req.body.teacher.user },
            { displayName: req.body.teacher.displayName }]
        }, (err, usr) => {
            if (!usr) {
                return res.status(400).send('err');
            }
            usr.inMsgs.push({
                from: {
                    user: req.body.user.user,
                    displayName: req.body.user.displayName
                },
                mdMsg: mdMsg,
                htmlMsg: htmlMsg,
                rawMsg: rawMsg,
                msgId: msgId
            });
            usr.save((a, b) => {
                io.emit('refresh', { user: req.body.teacher.user });
            });
            req.user.save((a, b) => {
                res.send('refresh');
            });
        });
    });

    router.post('/repLesson', this.authbit, (req, res, next) => {
        if (!req.body || !req.body.user || !req.body.teacher) {
            return res.status(400).send('err');
        }
        const topList = req.body.topics.length > 1 ? req.body.topics.slice(0, -1).join(', ') + ' and ' + req.body.topics.slice(-1) : req.body.topics[0],
            mdMsg = `User ${req.user.displayName || req.user.user} reported a lesson by mentor ${req.body.teacher.displayName || req.body.teacher.user} on: \n${req.body.topics.map(q => ' - ' + q + '\n')} \nReport time: ${new Date().toLocaleString()}`,
            htmlMsg = `User ${req.user.displayName || req.user.user} reported a lesson by mentor ${req.body.teacher.displayName || req.body.teacher.user} on: <ul>${req.body.topics.map(q => '<li>' + q + '</li>')}</ul><br> Report time: ${new Date().toLocaleString()}`,
            rawMsg = `User ${req.user.displayName || req.user.user} reported a lesson by mentor ${req.body.teacher.displayName || req.body.teacher.user} on: ${topList}. Report time: ${new Date().toLocaleString()}`,
            msgId = uuid.v4();
        req.user.outMsgs.push({
            to: [{
                user: '(mod team)',
                displayName: '(mod team)'
            }],
            mdMsg: mdMsg,
            htmlMsg: htmlMsg,
            rawMsg: rawMsg,
            msgId: msgId
        });
        mongoose.model('User').find({
            mod: true,
            user: {
                $in: [req.user.user,
                req.body.teacher.user]
            }
        }, (err, usrs) => {
            if (!usrs || !usrs.length) {
                return res.status(400).send('noUsrs');
            }
            usrs.forEach(usr => {
                usr.inMsgs.push({
                    from: {
                        user: req.body.iser.user,
                        displayName: req.body.iser.displayName
                    },
                    mdMsg: mdMsg,
                    htmlMsg: htmlMsg,
                    rawMsg: rawMsg,
                    msgId: msgId
                });
                usr.save((a, b) => {
                    io.emit('refresh', { user: usr.user });
                });
            });
            req.user.save((a, b) => {
                res.send('refresh');
            });
        });
    });

    //mentor page routes (message student, toggle active, hide)
    router.post('/LCmsgStudent', this.authbit, (req, res, next) => {
        const mdMsg = `Hi ${req.body.user.displayName || req.body.user.user}!\nYour teacher ${req.user.displayName || req.user.user} wants to discuss your current lesson.\n Please click to **reply** to message them back.`,
            htmlMsg = `Hi ${req.body.user.displayName || req.body.user.user}!<br>Your teacher ${req.user.displayName || req.user.user} wants to discuss your current lesson.<br> Please click to <strong>reply</strong> to message them back.`,
            rawMsg = `Hi ${req.body.user.displayName || req.body.user.user}!Your teacher ${req.user.displayName || req.user.user} wants to discuss your current lesson. Please click to reply to message them back.`,
            fullMsg = {
                to: [req.body.user],
                from: { user: req.user.user, displayName: req.user.displayName, msgId: uuid.v4() },
                mdMsg: mdMsg,
                htmlMsg: htmlMsg,
                rawMsg: rawMsg,
                topics: req.body.topics
            };
        mongoose.model('User').findOne({ user: req.body.user.user }, (err, tusr) => {
            if (err || !tusr) {
                return res.status(400).send('err');
            }
            req.user.outMsgs.push(fullMsg);
            req.user.save((a, b) => {
                res.send('refresh');
            });
            tusr.inMsgs.push(fullMsg);
            tusr.save((a, b) => {
                io.emit('refresh', { user: req.body.user.user });
            });
        });
        //and to user
    });
    router.get('/LCtoggleHide', this.authbit, (req, res, next) => {
        if (!req.query.id) {
            return res.status(400).send('err');
        }
        const theLesson = req.user.teaching.find(q => q._id == req.query.id);
        if (!theLesson) {
            return res.status(400).send('err');
        }
        theLesson.hidden = !theLesson.hidden;
        req.user.save((a, b) => {
            io.emit('refresh', { user: theLesson.user.user });
            res.send('refresh');
        });
    });
    router.get('/LCtoggleActive', this.authbit, (req, res, next) => {
        if (!req.query.id) {
            return res.status(400).send('err');
        }
        const theLesson = req.user.teaching.find(q => q._id == req.query.id);
        if (!theLesson) {
            return res.status(400).send('err');
        }
        theLesson.active = !theLesson.active;
        req.user.save((a, b) => {
            io.emit('refresh', { user: theLesson.user.user });
            res.send('refresh');
        });
    });

    //generate a demo user (mod only!)
    router.get('/genDemoUser', this.authbit, isMod, (req, res, next) => {
        const user = `${demoNames.adjectives[Math.floor(Math.random() * demoNames.adjectives.length)]}-${demoNames.animals[Math.floor(Math.random() * demoNames.animals.length)]}-${Math.ceil(Math.random() * 99)}`;
        req.body = {
            user: user,
            pass: Math.floor(Math.random() * 9999999999).toString(32)
        };
        passport.authenticate('local-signup', function (err, user, info) {
            // truncus('err', err, 'usr', user, 'inf', info)
            if (err) {
                return res.status(400).send(err);
            }
            mongoose.model('topic').find({}).exec((err, tps) => {
                const numTops = Math.floor(Math.random() * 0.75 * tps.length);
                tps = tps.sort(q => Math.floor(Math.random() * 3) - 1).slice(0, numTops).map(q => q.title);
                user.isDemoUser = true;
                user.interests = tps.map(q => {
                    const canTeach = Math.random() > 0.6;
                    return {
                        title: q,
                        lvl: canTeach ? Math.ceil(Math.random() * 5) + 5 : Math.floor(Math.random() * 11),
                        canTeach: canTeach
                    };
                });
                user.save((err, dsv) => {
                    res.send(`Your demo user: ${req.body.user}, password: ${req.body.pass} . WRITE THIS DOWN!`);
                });
            });
        })(req, res, next);
    });
    //TEMPORARY!

    // router.get('/ref', this.authbit, (req, res, next) => {
    //     res.send('refresh');
    // })
    // router.get('/tempAddTeachTop', this.authbit, (req, res, next) => {
    //     req.user.teachTopics.push({ title: req.query.t, lvl: Math.ceil(Math.random() * 10) })
    //     req.user.save();
    //     res.send('done');
    // })
    // router.get('/temp',(req,res,next)=>{
    //     res.send('Random number: '+Math.floor(Math.random()*100));
    // })
    router.get('/wipeMail', this.authbit, isMod, (req, res, next) => {
        mongoose.model('User').find({}, (err, usrs) => {
            usrs.forEach(u => {
                u.inMsgs = [];
                u.outMsgs = [];
                u.save();
            });
            res.send('DONE');
        });
    });

    return router;
};

module.exports = routeExp;