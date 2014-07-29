/**
 * 日志
 */
var fs = require('fs');
var join = require('path').join;
var colors = require('colors');
// 帮助文件
var help = join(__dirname, '../other/help');
var log = {
	version: function(){
		var version = require('../package.json').version;
		console.log('   _______________________________');
		console.log('  |     ' + ' ___        ___  '.green.bold +'         |');
		console.log('  |     ' + '|  __\\\\  //__  | '.green.bold +'         |');
		console.log('  |     ' + '| |   | |    | | '.green.bold +'         |');
		console.log('  |     ' + '| |   | |    | | '.green.bold +'         |');
		console.log('  |     ' + '|_|   |_|    |_| '.green.bold + ' v' + version +'  |');
		console.log('  |                               |');
		console.log('  |_______________________________|');
		console.log('\n');
		return log;
	},
	help: function(){
		log.version();
		var txt = fs.readFileSync(help, 'utf-8').toString();
		log.log(txt);
		return log;
	},
	log: function(message){
		var lines = message.split(/\n/);
		var reg = /\[(.*?)\]\((.*?)\)/g;
		lines.map(function(line) {
			var m = line.replace(reg, function(match, _1, _2, l) {
				var c = _2.split('.');
				var back = _1;
				c.map(function(v) {
					back = back[v];
				});
				return back;
			});
			console.log(m)
		});
	},
	note: function(message){
		if (message) {
			log.log('[>>> ](green)' + message)
		}
		return log;
	},
	warn: function(msg) {
		if (msg) {
			log.log('[>>> ](red)' + msg);
		}
		return log;
	},
	error: function(msg) {
		if (msg) {
			log.log('[>>> ](bold.red)' + msg);
		}
		return log;
	},
	tips: function() {
		log.log('[ERROR](bold.red)：命令有误，请使用 "mucuna --help" 查看帮助');
		return log;
	}
}
module.exports = log;