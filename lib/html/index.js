/**
 * html 压缩模块
 */
var path = require('path');

var logger = require('../logger');
var unit = require('../base');

function html(paths){
	var conf = this.conf;

	var cache = this.cache;

	// 打版本号
	function upVersion(code, d){

		code = code.replace(/([^"]*\.(?:js|css|swf|f4v|png|jpg|gif|jpeg|ico|cur))(\?v=\d+\.\w+)?/gim, function(a){
			var ps = a.split(/\?v=/);
			ps = ps[0];

			var suffix = path.extname(ps);
			var ch = path.resolve(d, ps);

			if(!cache[ch]){
				logger.warn(ch + ' is not find!');
				return a;
			}

			return ps +'?v='+ cache[ch].vs + suffix;
		})

		var vs = unit.text.md5(code);

		return {
			code: code,
			vs: vs
		}

	}
	// 单个地址处理
	function single(p){
		var code = unit.file.readFile(p);

		if(conf.HTML_COMPRESS){
			code = htmlParse(code);
		}

		var dir = unit.path.dir(p);

		var upv = upVersion(code, dir);

		cache[p] = upv;

		unit.file.writeFile(p, upv.code, conf.FILE_ENCODE);
	}

	var miniTime = logger.time('HTML MINI:');
	paths.forEach(single);
	miniTime.end();

}

module.exports = html;
