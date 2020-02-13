const gulp = require('gulp');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const livereload = require('gulp-livereload');
const cleanCSS = require('gulp-clean-css');
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const cssnext = require('postcss-cssnext');
const pxtorem = require('postcss-pxtorem');
const reporter = require('postcss-reporter');
const syntaxScss = require('postcss-scss');
const header = require('gulp-header');
const removeLogging = require('gulp-remove-logging');

const banner = [
  '/**',
  ' * Timeline - a horizontal / vertical timeline component',
  ' * v. 1.2.0',
  ' * Copyright Mike Collins',
  ' * MIT License',
  ' */',
  '',
].join('\n');

gulp.task('build-js', () => gulp
  .src('src/js/timeline.js')
  .pipe(plumber())
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
  .pipe(babel({
    presets: ['env']
  }))
  .pipe(uglify())
  .pipe(rename({ suffix: '.min' }))
  .pipe(header(banner))
  .pipe(gulp.dest('dist/js/'))
  .pipe(livereload()));

gulp.task('build-js-production', () => gulp
  .src('src/js/timeline.js')
  .pipe(plumber())
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError())
  .pipe(babel({
    presets: ['env']
  }))
  .pipe(uglify())
  .pipe(removeLogging())
  .pipe(rename({ suffix: '.prod.min' }))
  .pipe(header(banner))
  .pipe(gulp.dest('dist/js/'))
  .pipe(livereload()));

gulp.task('build-css', () => {
  const processors = [
    cssnext({ browsers: ['last 5 versions'] }),
    pxtorem({
      propWhiteList: ['font-size', 'padding', 'line-height', 'letter-spacing', 'margin'],
      mediaQuery: true,
      replace: true,
    }),
    reporter({
      clearMessages: true
    })
  ];

  return gulp
    .src('src/scss/timeline.scss')
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss(processors), { syntax: syntaxScss })
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleanCSS())
    .pipe(gulp.dest('dist/css/'))
    .pipe(livereload());
});

gulp.task('images', () => gulp
  .src('src/images/**')
  .pipe(imagemin())
  .pipe(gulp.dest('dist/images'))
  .pipe(livereload()));

gulp.task('watch', () => {
  livereload.listen();
  gulp.watch('src/scss/*.scss', gulp.series('build-css'));
  gulp.watch('src/images/**', gulp.series('images'));
  gulp.watch('src/js/timeline.js', gulp.series('build-js'));
});

gulp.task('default', gulp.parallel('build-js', 'build-js-production', 'build-css', 'images'));
