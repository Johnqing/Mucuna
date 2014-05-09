var uglifyjs = require('uglify-js');
var cssco = require('csso');
var htmlminify = require('./html/minify');

global.jsParse = function(code){
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

global.cssParse = function(code){
	return cssco.justDoIt(code)
}

global.HTMLParser = require('./html/htmlparse');

global.htmlConf = {
	collapseWhitespace: true,
	removeComments: true
};

global.htmlParse = function(code){
	return htmlminify.minify(code, htmlConf);
}