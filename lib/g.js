var uglifyjs = require('uglify-js');
var cssco = require('csso');
var logger = require('./logger');
/**
 * 转换为unicode编码
 * @param s
 * @returns {XML|string|*|void}
 */
function toUnicode(s){
	return s.replace(/([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/g,function(){
		return "\\u" + RegExp["$1"].charCodeAt(0).toString(16);
	});
}

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
		code = toUnicode(code);
	} catch (err){
		logger.error('使用 uglify-js压缩时发生错误');
	}
	return code;
}

global.cssParse = function(code){
	return cssco.justDoIt(code)
}

var defopts = {
	'level' : 'strip',   //压缩等级分为strip、strip_comment、strip_space,默认为strip
	'leftDelimiter' : '{%', //模板左界定符
	'rightDelimiter' : '%}' //模板右界定符
};

var HtmlCompress = require('./html/html.js');
global.htmlParse = function(code, opts){
	opts = opts || {};	for(var key in opts)
		defopts[key] = opts[key];
	return HtmlCompress.compress(code, defopts);
}