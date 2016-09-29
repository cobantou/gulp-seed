var gulp = require('gulp');
var csso = require('gulp-csso');//css压缩
var rename = require('gulp-rename');//文件重命名
var clean = require('gulp-clean'); //清除文件
var rev = require('gulp-rev'); //对文件名加MD5后缀
var revCollector = require('gulp-rev-collector'); //路径替换
var gulpSequence = require('gulp-sequence');	//任务串行
var less = require("gulp-less");//编译less
var autoprefixer = require('gulp-autoprefixer');//css 前缀
var uglify = require("gulp-uglify");//js压缩
var spritesmith = require('gulp.spritesmith');//雪碧图
var plumber = require('gulp-plumber');//出现异常并不终止watch事件
var notify = require('gulp-notify');//错误提示


 
function loadTask(lastFolder){
	var stream = gulp.src(['src/img/sprite/'+lastFolder+'/!(sprite).@(png|jpg)'])
	.pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
	.pipe(spritesmith({
		imgName: 'sprite.png',
		cssName: 'sprite.css',
		padding:5,
		spritestamp: true,//css时间戳
		cssTemplate:"src/img/sprite/handlebarsStr.css"//css模板
		
	}))
	.pipe(gulp.dest('src/img/sprite/'+lastFolder));
	return stream;
} 

function loadTasks(_taskFolders) {
	var streams=[];
	for(var i=0;i<_taskFolders.length;i++){
		streams.push(loadTask(_taskFolders[i]))
	}
	return streams;
}


//copy 
gulp.task('copy', function() {
    gulp.src(['src/img/**/*','src/pdf/**/*'],{base:'src'})
      .pipe(gulp.dest('lib'))
});


//less-->css
gulp.task('less', function () {
    gulp.src('src/less/**/*.less',{base:'src/less'})
    .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
    .pipe(less())
	.pipe(autoprefixer({
            browsers: ['last 2 versions','safari 5','Firefox >= 40', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'],
            cascade: false
        }))
    .pipe(gulp.dest('src/css'));
});

//clean [lib/css,lib/js]
gulp.task('clean',function() {
    return gulp.src(['lib/css/','lib/js/'], {
        read: false
    }).pipe(clean());
});


//rev&min   [css、js]
gulp.task('rev',function(){
	var streamCss,streamJs;
	//rev-css
	streamCss=gulp.src('src/css/**/*.css')		
        .pipe(csso())
		.pipe(rev())
        .pipe(gulp.dest('lib/css/'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('rev/css'));
	//rev-js
	streamJs=gulp.src('src/js/**/*.js')		
        .pipe(uglify())
		.pipe(rev())
        .pipe(gulp.dest('lib/js/'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('rev/js'));
		
	return  (streamCss,streamJs)
});





//modify html rev 
gulp.task('revCollector',function(){
	return  gulp.src(['rev/**/*.json','src/template/**/*.html'])
        .pipe(revCollector({
			replaceReved:true
		}))
		.pipe(gulp.dest('lib/html'));
})



//-------------------common use---------------------------------------

//需要处理的文件夹名称，名字为/src/img/sprite的下一层文件夹目录名
var taskFolders=[
"1"
];
//sprite
gulp.task('sprite', function () {
   loadTasks(taskFolders);
});


/* watch less ：整个less目录
 * watch sprite ：taskFolders里面写的目录
 */
gulp.task('watch',['less','sprite'],function(){
	gulp.watch('src/less/**/*',['less']);
	gulp.watch('src/img/sprite/+('+taskFolders.join('|') +')/*',['sprite']);
})


//build
gulp.task('build',gulpSequence('less','copy','clean', 'rev', 'revCollector'))
