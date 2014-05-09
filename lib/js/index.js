var path = require('path');



var unit = require('../base');
var logger = require('../logger');
var jsLint = require('../jsLint');




// 文件合并
function combine(cbList, cache){
	var code = '';
	cbList.forEach(function(item){
		code += ';' + cache[item].code;
	});
	return code;
}

var js = function(jsList){
	var conf = this.conf;

	var comboList = [],
		code, miniCode

	var miniCache = {}

	var miniTime = logger.time('JS MINI:');

	jsList.forEach(function(item){
		// 防止空项
		if(!item) return;

		var itemDir = unit.path.lastDir(item);

		var fPath = item.replace(path.sep + conf.BUILD_PATH, '');
		// 合并文件稍后处理，先压缩其他文件
		if(itemDir == conf.COMBINE_DIR){
			comboList.push(item);
			return
		};
		code = unit.file.readFile(item);

		// 语法检查
		if(conf.JS_REGULAR_CHECK){
			var result = jsLint(code, {
				"indent": 2,
				"plusplus": true,
				"sloppy": true,
				"eqeqeq": true,
				"maxlen": 120,
				"node": true,
				"nomen": true,
				"vars": true
			});
			if(result){
				logger.warn(fPath);
				logger.print(result);
			}
		}

		// 压缩
		if(conf.JS_COMPRESS){
			miniCode = jsParse(code);
		}

		miniCode = miniCode || code;

		// 收集到缓存对象中
		miniCache[item] = {
			code: miniCode,
			defPath: fPath,
			vs: unit.text.md5(miniCode)
		};
		unit.file.writeFile(item, miniCode, conf.FILE_ENCODE);
	});

	miniTime.end();
	// 合并

	if(!conf.JS_COMBINE) return miniCache;

	var comboTime = logger.time('JS COMBO:');

	comboList.forEach(function(item){
		var code = unit.file.readFile(item);
		var dir = unit.path.dir(item)
		var srcPath = code.match(/var\s+srcPath\s*=\s*(['|"])([\w\/\.]+)\1/im)[2];
		var codeArr = code.split(/\n/);
		var dwArr= [];
		codeArr.forEach(function(cd){
			if(!~cd.indexOf('document.write')) return;
			var dwPath = cd.match(/\s*document\.write.*srcPath[^'|"]+['|"]([^'|"]*\.js)['|"].*/i)[1];
			dwPath = srcPath + dwPath;
			dwPath = path.resolve(dir, dwPath);
			dwArr.push(dwPath);
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

	return miniCache;

}

module.exports = js;