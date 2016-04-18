var gulp        = require('gulp');
var bower       = require('gulp-bower');
var install     = require('gulp-install');
var uncss       = require('gulp-uncss');
var jshint      = require('gulp-jshint');
var uglify      = require('gulp-uglify');
var nano        = require('gulp-cssnano');
var ngAnnotate  = require('gulp-ng-annotate');
var usemin      = require('gulp-usemin');
var electron    = require('gulp-electron');
var packageJson = require('./package.json');

// Lint Task
gulp.task('lint', function() {
    return gulp.src(['src/**/*.js','!src/**/lib/**/*', '!src/node_modules/**/*'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('copy_views', function(){
  return gulp.src(['src/frontend/views/*'])
      .pipe(gulp.dest('dist/src/frontend/views/'));
});

gulp.task('copy_fonts', ['bower'], function(){
  return gulp.src(['src/frontend/lib/bootstrap/dist/fonts/*', 'src/frontend/styles/fonts/*'])
      .pipe(gulp.dest('dist/src/frontend/fonts/'));
});

gulp.task('copy_images', function(){
  return gulp.src(['src/frontend/images/*'])
      .pipe(gulp.dest('dist/src/frontend/images/'));
});

gulp.task('copy_node', function(){
  return gulp.src(['src/**/*', '!src/frontend/**/*', 'package.json'])
      .pipe(gulp.dest('dist/src/'));
});

gulp.task('npm', ['copy_node'], function(){
  gulp.src(['dist/src/package.json'])
  .pipe(install({production: true, ignoreScripts: true}));
});

gulp.task('bower', function() {
  return bower({ directory: 'src/frontend/lib/'});
});

gulp.task('usemin', ['bower', 'copy_views'], function(){
  return gulp.src('src/frontend/index.html')
    .pipe(usemin({
        ng: [ngAnnotate(), uglify(), 'concat'],
        js: [ngAnnotate(), uglify(), 'concat'],
        css: [/*uncss({html:['dist/src/frontend/**//*.html'], ignore:[/toast/i, /empty/i, /disabled/i, /active/i]}),*/nano(), 'concat']
      })
    )
    .pipe(gulp.dest('dist/src/frontend'));
});

gulp.task('build-exe', ['usemin', 'copy_node', 'copy_fonts', 'lint', 'npm'], function(){
  return gulp.src('')
    .pipe(electron({
      src: 'dist/src',
      packageJson: packageJson,
      cache: './dist/cache',
      release: './dist/apps',
      version: 'v0.37.2',
      platforms: ['win32-x64', 'darwin-x64'],
      packaging: true,
      asar: true,
      symbols: false,
      platformResources: {
            darwin: {
                CFBundleDisplayName: packageJson.name,
                CFBundleIdentifier: packageJson.name,
                CFBundleName: packageJson.name,
                CFBundleVersion: packageJson.version,
                icon: './icons/tetu.icns'
            },
            win: {
                "version-string": packageJson.version,
                "file-version": packageJson.version,
                "product-version": packageJson.version,
                "icon": './icons/tetu.ico'
            }
        }
    }))
    .pipe(gulp.dest(""));
});


// Default Task
gulp.task('default', ['lint', 'bower', 'npm', 'usemin', 'copy_fonts', 'copy_views', 'copy_images', 'copy_node', 'build-exe']);
