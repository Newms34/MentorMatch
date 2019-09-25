// First, we'll just include gulp itself.
const gulp = require('gulp');

// Include Our Plugins
const jshint = require('gulp-jshint'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    rename = require('gulp-rename'),
    terser = require('gulp-terser'),
    kid = require('child_process'),
    ps = require('ps-node'),
    cleany = require('gulp-clean-css'),
    babel = require('gulp-babel'),
    addSrc = require('gulp-add-src'),
    iife = require('gulp-iife'),
    th2 = require('through2'),
    chalk = require('chalk'),
    ngAnnotate = require('gulp-ng-annotate');
let sassStart = 0,
    jsStart = 0;

// Lint Task
gulp.task('lint', function () {
    let alreadyRan = false;
    return gulp.src(['build/js/*.js', 'build/js/**/*.js'])
        .pipe(th2.obj((file, enc, cb) => {
            if (!alreadyRan) {
                drawTitle('Front-End Linting');
                alreadyRan = true;
            }
            // jsStart = file._contents.toString('utf8').length;
            return cb(null, file);
        }))
        .pipe(jshint({
            esversion: 6
        }))
        .pipe(jshint.reporter('default'));
});

gulp.task('lintBE', function () {
    let alreadyRan = false;
    return gulp
        .src(['routes/*.js', 'routes/**/*.js', 'models/*.js', 'models/**/*.js'])
        .pipe(th2.obj((file, enc, cb) => {
            if (!alreadyRan) {
                drawTitle('Back-End Linting');
                alreadyRan = true;
            }
            // jsStart = file._contents.toString('utf8').length;
            return cb(null, file);
        }))
        .pipe(jshint({
            esversion: 6
        }))
        .pipe(jshint.reporter('default'));
});


// Compile Our Sass
gulp.task('sass', function () {
    let alreadyRan = false;
    return gulp.src('build/scss/*.scss')
        .pipe(th2.obj((file, enc, cb) => {
            if (!alreadyRan) {
                drawTitle('SASS (SCSS) Compiling');
                alreadyRan = true;
            }
            // jsStart = file._contents.toString('utf8').length;
            return cb(null, file);
        }))
        .pipe(sass())
        .pipe(th2.obj((file, enc, cb) => {
            // console.log('FILE IS',file._contents.toString('utf8'),'ENC',enc,'CB',cb);
            sassStart = file._contents.toString('utf8').length;
            return cb(null, file);
        }))
        .pipe(concat('styles.css'))
        .pipe(cleany())
        .pipe(th2.obj((file, enc, cb) => {
            // console.log('FILE IS',file._contents.toString('utf8'),'ENC',enc,'CB',cb);
            // sassDims.e = file._contents.toString('utf8');
            let sassEnd = file._contents.toString('utf8').length,
                sassRedPerc = Math.floor(10000 * (sassStart - sassEnd) / sassStart) / 100;
            console.log('CSS reduced from', sassStart, 'to', sassEnd + '. Reduction of', sassRedPerc + '%.')
            return cb(null, file);
        }))
        .pipe(gulp.dest('public/css'));
});

// Concatenate & Minify JS
gulp.task('scripts', function () {
    let alreadyRan = false;
    return gulp.src(['build/js/*.js', 'build/js/**/*.js'])
        .pipe(th2.obj((file, enc, cb) => {
            if (!alreadyRan) {
                drawTitle('Front-End Script Concatenation, Minification, and Uglification');
                alreadyRan = true;
            }
            // jsStart = file._contents.toString('utf8').length;
            return cb(null, file);
        }))
        .pipe(concat('allCust.js'))
        .pipe(th2.obj((file, enc, cb) => {
            // console.log('FILE IS',file._contents.toString('utf8'),'ENC',enc,'CB',cb);
            jsStart = file._contents.toString('utf8').length;
            return cb(null, file);
        }))
        .pipe(iife())
        .pipe(gulp.dest('public/js'))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(ngAnnotate())
        .pipe(terser())
        // .pipe(uglify({warnings:true}).on('error', gutil.log))
        .pipe(th2.obj((file, enc, cb) => {
            // console.log('FILE IS',file._contents.toString('utf8'),'ENC',enc,'CB',cb);
            let jsEnd = file._contents.toString('utf8').length,
                jsRedPerc = Math.floor(10000 * (jsStart - jsEnd) / jsStart) / 100;
            console.log('JS reduced from', jsStart, 'to', jsEnd + '. Reduction of', jsRedPerc + '%.')
            return cb(null, file);
        }))
        .pipe(addSrc.prepend(['build/libs/*.js', 'build/libs/**/*.js']))
        .pipe(concat('all.js'))
        .pipe(rename('all.min.js'))
        .pipe(gulp.dest('public/js'));
});
gulp.task('checkDB', function () {
    // let alreadyRan = false;
    return new Promise(function (resolve, reject) {
        if (process.platform == 'win32' && process.env.USERNAME == 'Newms') {
            drawTitle('Checking MongoDB Status')
            // console.log('Checking to see if mongod already running!');
            ps.lookup({
                command: 'mongod'
            }, function (e, f) {
                // console.log('result of run request',e,f)
                if (!f.length) {
                    //database not already running, so start it up!
                    kid.exec('c: && cd C:\Program Files\MongoDB\Server\4.2\bin && start mongod -dbpath "e:\mongodata" && pause', function (err, stdout, stderr) {
                        if (err) console.log('Uh oh! An error of "', err, '" prevented the DB from starting!');
                    })
                    resolve();
                } else {
                    console.log('mongod running!')
                    resolve();
                }
            })
        }
    });
})
//start mongod -dbpath "d:\\data\\mongo\\db
// Watch Files For Changes
gulp.task('watch', function () {
    let alreadyRan = false;
    drawTitle('Watching Front-End scripts, Back-End Scripts, and CSS', true)
    gulp.watch(['build/js/**/*.js', 'build/js/*.js'], gulp.series('lint', 'scripts'));
    gulp.watch(['routes/*.js', 'routes/**/*.js', 'models/*.js', 'models/**/*.js'], gulp.series('lintBE'))
    gulp.watch(['build/scss/*.scss', 'build/scss/**/*.scss'], gulp.series('sass'));
});

//task to simply create everything without actually watching or starting the DB
gulp.task('render', gulp.series('lint', 'lintBE', 'sass', 'scripts'))

// Default Task
gulp.task('default', gulp.series('lint', 'lintBE', 'sass', 'scripts', 'checkDB', 'watch'));

let currColInd = 0;

const drawTitle = (t, w) => {
    // console.log('cols',process.stdout.columns);
    let wid = process.stdout.columns;
    // console.log(wid, t.length)
    if (t.length >= wid) {
        console.log(chalk['bg' + colorBgs[currColInd]](t.slice(0, wid)));
    } else {
        let dif = wid - t.length,
            front = 0,
            back = 0;
        if (dif % 2 == 0) {
            front = dif / 2;
            back = dif / 2;
        } else {
            front = (dif - 1) / 2;
            back = (dif + 1) / 2;
        }
        // console.log('dif', dif)
        console.log(chalk['bg' + colorBgs[currColInd]]((' '.repeat(front)) + t + (' '.repeat(back))))
    }
    currColInd++;
    currColInd = currColInd % colorBgs.length;
    if (w) {
        //draw caution bars
        let wt = wid % 2 === 0 ? wid : wid - 1;

        console.log((chalk.bgYellowBright(' ') + chalk.bgBlack(' ')).repeat(wt / 2))
    }
},
    colorBgs = ['Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan'];