/**
 * css min and combo
 */
var path = require('path');

var cssLint = require('../cssLint');

var logger = require('../logger');
var unit = require('../base');


function combine(cbList, cache){
	var code = '';
	cbList.forEach(function(item){
		code += cache[item].code;
	});
	return code;
}


var css = function(cssList){
	var that = this;
	var conf = that.conf;

	var comboList = [];
	var miniCache = {}

	var miniTime = logger.time('CSS MINI:');
	cssList.forEach(function(item){

		var itemDir = unit.path.lastDir(item);

		var fPath = item.replace(path.sep + conf.BUILD_PATH, '');
		// 合并文件稍后处理，先压缩其他文件
		if(itemDir == conf.COMBINE_DIR){
			comboList.push(item);
			return;
		};

		var code = unit.file.readFile(item);

		// 语法
		if(conf.CSS_REGULAR_CHECK){
			var result = cssLint(code);
			if(result){
				logger.warn(fPath);
				logger.print(result);
			}
		}
		// css 压缩
		if(conf.CSS_COMPRESS){
			code = cssParse(code);
		}

		// 收集到缓存对象中
		miniCache[item] = {
			code: code,
			defPath: fPath,
			vs: unit.text.md5(code)
		};

		var cache = that.cache;
		var dir = unit.path.dir(item);

		var regx = /url\s*\(\s*(['|"]?)([^\/]?[\w\-\/\.]*\.(?:png|jpg|gif|jpeg|ico|cur))(\?[^\?'|")\s]*)?\1\s*\)/gim;

		code = code.replace(/url\s*\(\s*(['|"]?)([\w\-\/\.]+\.(?:png|jpg|gif|jpeg|ico|cur))(?:\?[^\?'|")\s]*)?\1\s*\)/gim, function(a){
			var src = a.replace(regx, '$2');
			var suffix = path.extname(src);
			var ch = path.resolve(dir, src);
			if(!cache[ch]){
				logger.warn(src + ' is not find!');
				return 'url('+src+')'
			}
			var vs = cache[ch].vs;

			var out = a.replace(regx, '$2?v=' + vs+suffix);
			return 'url('+out+')';
		});

		miniCache[item].code = code;

		unit.file.writeFile(item, code, conf.FILE_ENCODE);

	});

	miniTime.end();


	if(!conf.CSS_COMBINE) return miniCache;

	var comboTime = logger.time('CSS COMBO:');

	comboList.forEach(function(item){
		var code = unit.file.readFile(item);
		// 获取文件路径，不包含文件名
		var dir = unit.path.dir(item);

		var codeArr = code.split(/\n/);
		var dwArr = [];
		codeArr.forEach(function(cd){
			if(!~cd.indexOf('@import')) return;

			var dw = cd.match(/(@import\s+url\s*\(\s*(?:['|"]?)([\w\/_\.:\-]+\.css)(?:\?[^'|")]*)?(?:['|"]?)\s*\)\s*[;]?)/)[2];
			dw = path.resolve(dir, dw);
			dwArr.push(dw);
		});

		var fPath = item.replace(path.sep + conf.BUILD_PATH, '');

		var cbCode = combine(dwArr, miniCache);

		unit.file.writeFile(item, cbCode, conf.FILE_ENCODE);
		// 收集到缓存对象中
		miniCache[item] = {
			code: cbCode,
			defPath: fPath,
			vs: unit.text.md5(cbCode)
		};

	});

	comboTime.end();

}


module.exports = css;