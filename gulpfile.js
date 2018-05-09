const gulp = require('gulp');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const sass = require('gulp-sass');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
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

const banner = [
  '/**',
  ' * Timeline - a horizontal / vertical timeline component',
  ' * v. 1.1.2',
  ' * Copyright Mike Collins',
  ' * MIT License',
  ' */',
  '',
].join('\n');

gulp.task('build-js', () =>
  gulp
    .src('src/js/timeline.js')
    .pipe(plumber())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['env'],
    }))
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(header(banner))
    .pipe(sourcemaps.write('./'))
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
    .pipe(sourcemaps.init())
    .pipe(sass())
    .pipe(postcss(processors), { syntax: syntaxScss })
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleanCSS())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist/css/'))
    .pipe(livereload());
});

gulp.task('images', () =>
  gulp
    .src('src/images/**')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/images'))
    .pipe(livereload()));

gulp.task('watch', () => {
  livereload.listen();
  gulp.watch('src/scss/*.scss', ['build-css']);
  gulp.watch('src/images/**', ['images']);
  gulp.watch('src/js/timeline.js', ['build-js']);
});

gulp.task('default', ['build-js', 'build-css', 'images']);
