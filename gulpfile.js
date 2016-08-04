var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var less = require('gulp-less');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');

var pkg = require('./package.json');
var webpackconf = require('./webpack.config.js');

gulp.task('compress', function () {
  return gulp.src('src/enter.js')
		.pipe(babel({
    	presets: ['es2015']
    }))
    .pipe(uglify())
    .pipe(gulp.dest('app'));
});

gulp.task('webpack', function(callback) {
	webpack(webpackconf, function(err, stats) {
		if (err) throw new gutil.PluginError('webpack', err);
		gutil.log('[webpack]', stats.toString({
			modules: false,
			colors: true
		}));
		callback();
	})
});

gulp.task('watch', ['build'], function () {
    gulp.watch(['./src/**/*.js'], ['webpack']);
});

gulp.task('build', ['compress', 'webpack']);
gulp.task('default', ['build']);
