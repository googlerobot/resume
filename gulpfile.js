"use strict";

var fs = require('fs');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var yaml = require('js-yaml');
//@see https://www.npmjs.com/package/gulp-nunjucks-render
var nunjucksRender = require('gulp-nunjucks-render');
var data = require('gulp-data');

var AUTOPREFIXER_BROWSERS = [
  'ie >= 10',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4.4',
  'bb >= 10'
];

function loadYamlConfig(file) {
  try {
    return yaml.safeLoad(fs.readFileSync('./app/config.yml', 'utf8'));
  } catch (e) {
    return {};
  }
}

gulp.task('html', function () {
  nunjucksRender.nunjucks.configure(['app/']);
  return gulp.src('app/*.twig')
    .pipe(data(loadYamlConfig))
    .pipe(nunjucksRender().on('error', function (e) {
      console.log(e)
    }))
    .pipe($.replace('<link rel="stylesheet" href="static/css/responsive.css"/>', ''))
    .pipe($.replace('static/css/base.css', 'static/css/base.min.css'))
    .pipe($.minifyHtml())
    .pipe(gulp.dest('dist/'))
    .pipe($.size({title: 'html'}));
});

// Copy web fonts to dist
gulp.task('fonts', function () {
  return gulp.src(['app/static/fonts/**'])
    .pipe(gulp.dest('dist/static/fonts'))
    .pipe($.size({title: 'fonts'}));
});

// Optimize images
gulp.task('images', function () {
  return gulp.src('app/static/img/*')
    .pipe(gulp.dest('dist/static/img'))
    .pipe($.size({title: 'images'}));
});

// 编译less
gulp.task('less', function () {
  return gulp.src([
    'app/static/less/**/*.less'
  ]).pipe($.less())
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe(gulp.dest('dist/static/css'))
    .pipe($.concatCss('base.min.css'))
    .pipe($.csso())
    .pipe(gulp.dest('dist/static/css'))
    .pipe($.size({title: 'less'}));
});

//编译并压缩css
gulp.task('less-min', function () {
  del(['dist/static/css/*.css'], {dot: true});
  return gulp.src([
    'app/static/less/base.less',
    'app/static/less/responsive.less'
  ]).pipe($.less())
    .pipe($.autoprefixer({browsers: AUTOPREFIXER_BROWSERS}))
    .pipe($.concatCss('base.min.css'))
    .pipe($.csso())
    .pipe(gulp.dest('dist/static/css'))
    .pipe($.size({title: 'less'}));
});

//清空数据.
gulp.task('clean', del.bind(null, ['dist/**/*'], {dot: true}));

/**
 * 开发预览
 */
gulp.task('serve', ['clean', 'html', 'less'], function () {
  browserSync.init({
    notify: false,
    server: ['./dist', './app']
  });

  //自动刷新.
  gulp.watch(['app/*.yml', 'app/*.twig'], ['html', reload]);
  gulp.watch("app/static/less/*.less", ['less', reload]);
  gulp.watch(['app/scripts/**/*.js'], ['jshint']);
  gulp.watch(['app/images/**/*'], reload);
});


/**
 * 构建
 */
gulp.task('build',['fonts', 'images', 'less-min', 'html']);

/**
 * 发布预览
 */
gulp.task('serve:dist', ['build'], function () {
  browserSync.init({
    notify: false,
    server: 'dist'
  });
});


/**
 * 发布到github pages
 */
gulp.task('publish', ['build'], function () {
  return gulp.src([
    './dist/**/*',
    'app/CNAME'
  ]).pipe($.ghPages());
});

//默认开发
gulp.task('default', ['serve']);
