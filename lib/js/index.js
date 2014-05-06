var path = require('path');
var uglifyjs = require('uglify-js')


var unit = require('../base');
var logger = require('../logger');


function jsParse(code){
	try{
		var jsp = uglifyjs.parse,
			pro = uglifyjs.uglify,
		// 解析成语法树
			ast = jsp(code);
		ast.figure_out_scope();
		var compressor = uglifyjs.Compressor({
			// 逗号操作符隔开
			sequences     : true,
			//属性优化 a[b] => a.b
			properties    : true,
			// 删掉没用的代码
			dead_code     : true,
			//干掉 debugger
			drop_debugger : true,
			// 不安全因素优化
			unsafe        : true,
			// 条件语句优化 转为三目
			conditionals  : true,
			// 常量优化
			evaluate      : false,
			unused        : false,
			hoist_funs    : false,
			hoist_vars    : false,
			if_return     : false,
			join_vars     : false,
			cascade       : false,
			side_effects  : false,
			global_defs   : {}
		});
		ast = ast.transform(compressor);
		ast.mangle_names();
		code = ast.print_to_string();
	} catch (err){
		logger.error('使用 uglify-js压缩时发生错误： ' + err);
	}
	return code;
}

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
		// 根据配置来看是否压缩
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