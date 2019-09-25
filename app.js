const express = require('express'),
    app = express(),
    http = require('http'),
    server = http.Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    // cookie = require('cookie'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    compression = require('compression');
app.use(compression());

const sesh = session({
    secret: 'ea augusta est et carissima'
});
const usrModel = require('./models/users')
app.use(sesh);
app.use(passport.initialize());
app.use(passport.session());
const passportSetup = require('./config/passport-setup');
app.use(helmet());

app.use(cookieParser('spero eam beatam esse'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('io', io)
// app.set('pp', passport)
const routes = require('./routes')(io);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', routes);
let names = [];
let isFirstCon=true;
io.on('connection', function(socket) {
    socket.on('testFn',function(d){
        socket.emit('testOut',d);
    })
});
server.listen(process.env.PORT || 8080);
server.on('error', function(err) {
    console.log('Oh no! Err:', err)
});
server.on('listening', function(lst) {
    console.log('Server is listening!')
});
server.on('request', function(req) {
    // console.log(req.url);
})

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log('Client (probly) err:', err)
    res.send('Error!' + err)
});