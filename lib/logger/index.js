/**
 * logs Manage
 */

var fs = require('fs');
var path = require('path');

var cwd = process.cwd(),
	colors = [
		36,
		32,
		34,
		33,
		35,
		31,
		41
	],
	type = [
		'TRACE',
		'DEBUG',
		'INFO',
		'WARNING',
		'ERROR',
		'FATAL'
	];

/**
 * 分隔日志
 * @param log
 * @param color
 * @returns {string}
 */
var formatLog = function(log, color){
	var tag = '',
		head = '',
		foot = '';

	if(color){
		head = '\x1B[';
		foot = '\x1B[0m';
		tag = colors[6]+'m';
		color = colors[log.type]+'m';
	}

	return [
		log.time,
		' [',
			head,
			color,
			type[log.type],
			foot,
		'] [',
			head,
			tag,
			log.pos,
			foot,
		'] ',
		log.msg
	].join('');
}
/**
 * 补位
 * @param n
 * @returns {*}
 */
function cover(n){
	return n > 9 ? n : ('0' + n);
}
/**
 * 获取时间
 * @returns {string}
 */
function getTime(){
	var time = new Date();
	return time.getFullYear()
		+ '-'
		+ cover(time.getMonth()+1)
		+ '-'
		+ cover(time.getDate())
		+ ' '
		+ cover(time.getHours())
		+ ':'
		+ cover(time.getMinutes())
		+ ':'
		+ cover(time.getSeconds())
}
/**
 * 通过写入错误来捕获当前的位置
 * @returns {string}
 */
function getPos(){
	try{
		a.b.c()
	} catch (err){
		var pos = err.stack.split('\n')[4].replace(cwd, '').replace(/\\/g, '/').split('/');
		pos = pos[1].replace(/(:\d)/g, '');
		return pos.substring(0, pos.length-1);
	}
}

/**
 * 对console.log进行一次包装
 * @param type
 * @param msg
 * @private
 */
var log = function(type, msg){
	var log = {
		type: type,
		msg: msg,
		time: getTime(),
		pos: getPos()
	};
	console.log(formatLog(log, true));
}


var Timer = function(text){
	this.text = text;
	this.sTime = +new Date();
}

Timer.prototype = {
	end: function(){
		var eTime = +new Date();
		var t = (eTime - this.sTime)/1000;
		console.log(this.text + t + '秒');
	}
}

/**
 * 输出对象
 */
var logger = function(){

	return {
		time: function(text){
			return new Timer(text);
		},
		print: function(text){
			console.log(text);
		},
		/**
		 * 追踪错误
		 * @param text
		 */
		trace: function(text){
			log(0, text);
		},
		/**
		 * debug
		 * @param text
		 */
		debug: function(text){
			log(1, text);
		},
		/**
		 * 信息
		 * @param text
		 */
		info: function(text){
			log(2, text);
		},
		/**
		 * 警告
		 * @param text
		 */
		warn: function(text){
			log(3, text);
		},
		/**
		 * 错误
		 * @param text
		 */
		error: function(text){
			log(4, text);
		},
		/**
		 * 致命错误
		 * @param text
		 */
		fatal: function(text){
			log(5, text);
		}
	}
}()

module.exports = logger;
