/**
 * 入口
 */
var fs = require('fs');

var logger = require('./lib/logger');
var until = require('./lib/base');
var jser = require('./lib/js');
var csser = require('./lib/css');
var imger = require('./lib/img');

var config = until.config.init();

function Mucuna(){
	this.init();
}

Mucuna.prototype = {
	init: function(){
		logger.print('=============== Mucuna start ===============\n');
		this.conf = config;

		var end = 0;

		function mDone(){
			end++;
			if(end >= 2){
				logger.print('\n=============== Mucuna end ===============');
			}
		}

		this.static(mDone);
		this.tpl(mDone);
	},
	/**
	 * 静态资源处理控制（不包含模板压缩）
	 */
	static: function(cb){
		var conf = this.conf;
		if(!fs.existsSync(conf.STATIC_PATH)){
			logger.fatal('静态资源目录：' + conf.STATIC_PATH + ' 不存在');
			cb && cb();
			return;
		}
		var that = this;

		until.file.cpdirSync(conf.STATIC_PATH, conf.S_BUILD_PATH);

		logger.print('资源文件copy完成，准备压缩/合并');

		until.file.walk(conf.S_BUILD_PATH, function(list){
			var staticObj = that.staticSp(list);
			that.hasStatic(staticObj);
			cb && cb();
		});
	},
	hasStatic: function(obj){
		var conf = this.conf;
		if(obj.js.length){
			jser.call(this, obj.js);
		}
	},
	/**
	 * 筛选不同类型文件
	 * @param fileArr
	 * @returns {{js: (*|Array), css: (*|Array), img: (*|Array)}}
	 */
	staticSp: function(fileArr){
		var js = fileArr.filter(function(f){
			return /\.(?:js)/.test(f);
		});
		var css = fileArr.filter(function(f){
			return /\.(?:css)/.test(f);
		});
		var img = fileArr.filter(function(f){
			return /\.(?:jpg|jpeg|gif|png|ico)/.test(f);
		});

		return {
			js: js,
			css: css,
			img: img
		}
	},
	tpl: function(cb){
		var that = this;
		var conf = that.conf;

		if(!fs.existsSync(conf.TPL_PATH)){
			logger.fatal('模板目录：' + conf.TPL_PATH + ' 不存在');
			cb && cb();
			return;
		}
		until.file.cpdirSync(conf.TPL_PATH, conf.T_BUILD_PATH);

		logger.print('模板文件copy完成，准备压缩/版本号更新');

		until.file.walk(conf.BUILD_PATH, function(list){
			cb && cb();
		});
	}
}

new Mucuna();