var fs = require('fs');
var EventProxy = require('eventproxy');
var path = require('path');
var join = path.join;

var uglifyjs = require('uglify-js');
var cssco = require('csso');
// 自建-工具
var log = require('./libs/log');
var prompt = require('./libs/prompt');
var Utils = require('./libs/utils');
var Timer = require('./libs/timer');
var Queue = require('./libs/queue');
var queue = new Queue();
/**
 * js 压缩
 * @param code
 * @returns {*}
 * @private
 */
function _jsMin(code, options){
	options = options || {};
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
		options.error && options.error(err);
	}
	return code;
}
/**
 * css压缩
 * @param code
 * @returns {*}
 * @private
 */
function _cssMin(code){
	return cssco.justDoIt(code)
}

// api
var _ = module.exports;
/**
 *
 * @param fns
 */
_.handle = function(fns){
	if(!Array.isArray(fns))
		fns = [fns];

	for(var i=0; i<fns.length; i++){
		var item = fns[i];
		queue.add(_[item]);
	}
	queue.add(_.output).add(_.end);
	queue.next();
	return _;
}


/**
 * 输入内容
 * @param prompts
 * @param cb
 */
_.prompt = function(prompts, cb){
	prompts = prompt.parseFile(prompts);
	prompt.prompt(prompts, function(err, props){
		if(err)
			return cb(err);
		cb && cb(props);
	});
}

/**
 * 验证log
 * @param name
 * @param time
 */
_.validateLog = function(name, time){
	log.note(name + '   :  ' + time + 's');
}
/**
 * 计时器
 * @returns {Timer}
 */
_.timing = function(){
	return new Timer();
}

// 记录用户输入的配置
_.props = {};
// 代码缓存
_.codes = {};
// 错误信息
_.errorList = {
	warn: [],
	error: []
};

// 初始化
_.init = function(route){
	//记录执行路径
	_.route = route;
	_.files = {
		combo: {
			js: [],
			css: []
		},
		static: {
			css: [],
			js: [],
			html: [],
			img: []
		},
		tpl: []
	}
	return _;
}

/**
 * 启动时，路径匹配/设置
 * @param config
 * @returns {exports}
 */
_.start = function(config, cb){
	log.log('[*****************Mucuna START******************](green)');

	config['BUILD_PATH'] = join(this.route, config['BUILD_PATH']);

	config['TPL_BUILD_PATH'] = join(config['BUILD_PATH'], config['TPL_PATH']);
	config['TPL_PATH'] = join(this.route, config['TPL_PATH']);

	config['STATIC_BUILD_PATH'] = join(config['BUILD_PATH'], config['STATIC_PATH']);
	config['STATIC_PATH'] = join(this.route, config['STATIC_PATH']);

	config['COMBINE_DIR'] = join(config['STATIC_BUILD_PATH'], config['COMBINE_DIR']);

	config['SPRITE_SOURCE_PATH'] = join(config['BUILD_PATH'], config['SPRITE_SOURCE_PATH']);
	config['SPRITE_DEST_PATH'] = join(config['BUILD_PATH'], config['SPRITE_DEST_PATH']);

	// 记录配置
	_.config = config;
	_.endCallback = cb || function(){};
	return _;
}
/**
 * 结束，用来打印错误日志
 */
_.end = function(){
	var errLen = _.errorList.error.length;
	var warnLen = _.errorList.warn.length;
	// 输出错误信息
	for(var i=0; i<errLen; i++){
		log.error(_.errorList.error[i]);
	}

	// 输出一般错误
	for(var i=0; i<warnLen; i++){
		log.warn(_.errorList.warn[i]);
	}

	_.endCallback.call(_);
}

/**
 * 检查目录结构是否正确
 */
_.checkDir = function(){
	var t = _.timing();

	var staticPath = _.config['STATIC_PATH'];
	var tplPath = _.config['TPL_PATH'];
	// 静态文件目录检查
	if(!fs.existsSync(staticPath))
		_.errorList.error.push(staticPath + '目录不存在');
	// 模板文件目录检查
	if(!fs.existsSync(tplPath))
		_.errorList.error.push(staticPath + '目录不存在');
	// 打印日志
	_.validateLog('Validate_Dir', t.end());
	queue.next();
	return _;
}
/**
 * 查找模板/静态文件
 */
_.findFiles = function(){
	var t = _.timing();

	var staticPath = _.config['STATIC_PATH'];
	var tplPath = _.config['TPL_PATH'];
	// 遍历静态文件
	var done = function(stList, tpList){
		var js = stList.filter(function(f){
			return /\.(?:js)/.test(f);
		});
		var css = stList.filter(function(f){
			return /\.(?:css)/.test(f);
		});
		var img = stList.filter(function(f){
			return /\.(?:jpg|jpeg|gif|png|ico)/.test(f);
		});

		var html = stList.filter(function(f){
			return /\.(?:html|htm|shtml|tpl)/.test(f);
		});

		_.files.static = {
			js: js,
			css: css,
			img: img,
			html: html
		}
		_.files.tpl = tpList;

		_.validateLog('Find files', t.end());
		queue.next();
	}

	var proxy = new EventProxy();
	proxy.all('static', 'tpl', done);

	Utils.file.walk(staticPath, function(list){
		var newList = [];
		list.forEach(function(item){
			var dir = Utils.path.lastDir(item);
			var comboDir = Utils.path.lastDir( _.config['COMBINE_DIR']);
			if(dir == comboDir) {
				if(/\.(?:js)/.test(item)){
					_.files.combo.js.push(item);
				}else{
					_.files.combo.css.push(item);
				}
			}else{
				newList.push(item);
			}
			_.codes[item] = Utils.file.readFile(item);
		})
		proxy.emit('static', newList);
	});

	Utils.file.walk(tplPath, function(list){
		list.forEach(function(item){
			_.codes[item] = Utils.file.readFile(item);
		})
		proxy.emit('tpl', list);
	});
	return _;
}
/**
 * html5验证
 * @returns {*}
 */
_.validateHtml5 = function(){
	if(!_.config['VALIDATE_HTML']){
		queue.next()
		return _;
	}
	var t = _.timing();
	var tpls = _.files.tpl;
	var len = tpls.length;

	if(!len){
		_.errorList.warn.push('Template is null ！');
		_.validateLog('Validate Template', t.end());
		queue.next();
		return this;
	}

	var html5Lint = require('html5-lint');

	var done = function(){
		_.validateLog('Validate Template', t.end());
		queue.next();
	}

	var check = function(code, cb){
		html5Lint(code, function(err, results){
			results.messages.forEach(function(msg) {
				var type = msg.type,
					message = msg.message;
				if(type != 'error') return;
				_.errorList.warn.push("Validate HTML5 :"+message);
			});
			len--;
			cb && cb();
		});
	}

	tpls.forEach(function(item){
		var code = _.codes[item];
		check(code, function(){
			if(len<=0){
				done();
			}
		});
	});

	return this;
}
/**
 * js语法验证
 * @returns {*}
 */
_.validateJs = function(){
	if(!_.config['VALIDATE_JS']){
		queue.next();
		return _;
	}
	var t = _.timing();
	var jsList = _.files.static.js;
	var len = jsList.length;
	// js不存在的项目比较多，所以不提醒
	if(!len){
		queue.next();
		return this;
	}

	var jsLint = require('./plugins/jsLint');

	jsList.forEach(function(item){
		var code = _.codes[item];
		var result = jsLint(code ,{
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
			_.errorList.warn.push("js Lint : \n"+result);
		}

	});
	_.validateLog('Validate JS', t.end());
	queue.next();
	return this;

}
/**
 * css语法验证
 * @returns {*}
 */
_.validateCss = function(){
	if(!_.config['VALIDATE_CSS']){
		queue.next()
		return _;
	}
	var t = _.timing();
	var cssList = _.files.static.css;
	var len = cssList.length;

	if(!len){
		_.errorList.warn.push('CSS is null ！');
		_.validateLog('Validate CSS', t.end());
		queue.next();
		return this;
	}
	var cssLint = require('./plugins/cssLint');
	cssList.forEach(function(item){
		var code = _.codes[item];
		var result = cssLint(code);
		if(result){
			_.errorList.warn.push("css Lint : \n"+result);
		}
	});
	_.validateLog('Validate CSS', t.end());
	queue.next();
	return this;
}
/**
 * html压缩
 * @returns {*}
 */
_.htmlMin = function(){
	if(!_.config['COMPRESS_HTML']){
		queue.next()
		return _;
	}
	// 插件
	var t = _.timing();
	var tpls = _.files.tpl;
	var stHtml = _.files.static.html;
	var htmls = tpls.concat(stHtml);

	var htmlCompress = require('./plugins/htmlCompress');

	htmls.forEach(function(item){
		var code = _.codes[item];
		_.codes[item] = htmlCompress.compress(code, {
			jsMin: _jsMin,
			cssMin: _cssMin
		});
	});

	_.validateLog('Compress HTML', t.end());
	queue.next();
	return this;
}

/**
 * jsMin
 * @returns {*}
 */
_.jsMin = function(){
	if(!_.config['COMPRESS_JS']){
		queue.next()
		return _;
	}

	var t = _.timing();
	var jsList = _.files.static.js;

	jsList.forEach(function(item){
		var code = _.codes[item];
		_.codes[item] = _jsMin(code, {
			error: function(err){
				_.errorList.error.push(err);
			}
		});
	});

	_.validateLog('Compress JS', t.end());
	queue.next();
	return this;

}
/**
 * cssMin
 * @returns {*}
 */
_.cssMin = function(){
	if(!_.config['COMPRESS_CSS']){
		queue.next()
		return _;
	}

	var t = _.timing();
	var cssList = _.files.static.css;

	cssList.forEach(function(item){
		var code = _.codes[item];
		_.codes[item] = _cssMin(code);
	});

	_.validateLog('Compress CSS', t.end());
	queue.next();
	return this;

}
/**
 * 图片压缩
 * @returns {*}
 */
_.imgMin = function(){
	if(!_.config['COMPRESS_CSS']){
		queue.next()
		return _;
	}

	var t = _.timing();
	var imgList = _.files.static.img;

	var smushit = require('node-smushit');
	smushit.smushit(imgList, {
		verbose: false,
		onItemComplete: function(e){
			if(e){
				_.errorList.warn.push(e);
				return;
			};
		},
		onComplete: function(){
			_.validateLog('Compress Img', t.end());
			queue.next();
		}
	});
	return this;
}

// 文件合并
function _combine(list, isSem){
	var code = '';
	var sem = isSem ? ';' : ''
	list.forEach(function(item){
		code += sem + _.codes[item];
	});
	return code;
}
/**
 * js合并
 * @returns {*}
 */
_.combineJS = function(){
	if(!_.config['COMBINE_JS']){
		queue.next()
		return _;
	}

	var t = _.timing();
	var list = _.files.combo.js;

	list.forEach(function(item){
		var code = _.codes[item];
		var srcPath = code.match(/var\s+srcPath\s*=\s*(['|"])([\w\/\.]+)\1/im)[2];
		var codeArr = code.split(/\n/);
		var dir = Utils.path.dir(item);
		var pathArr = []
		codeArr.forEach(function(p){
			if(!~p.indexOf('document.write')) return;
			var dwPath = p.match(/\s*document\.write.*srcPath[^'|"]+['|"]([^'|"]*\.js)['|"].*/i)[1];
			dwPath = srcPath + dwPath;
			pathArr.push(path.resolve(dir, dwPath));
		});
		_.codes[item] = _jsMin(_combine(pathArr, true), {
			error: function(err){
				_.errorList.error.push(err);
			}
		});

	});

	_.validateLog('Combine JS', t.end());
	queue.next();
	return this;
}
/**
 * 合并css文件
 * @returns {*}
 */
_.combineCss = function(){
	if(!_.config['COMBINE_JS']){
		queue.next()
		return _;
	}

	var t = _.timing();
	var list = _.files.combo.css;

	list.forEach(function(item){
		var dir = Utils.path.dir(item);
		var code = _.codes[item];
		var pathArr = [];

		var codeArr = code.split(/\n/);
		codeArr.forEach(function(p){
			if(!~p.indexOf('@import')) return;

			var dw = p.match(/(@import\s+url\s*\(\s*(?:['|"]?)([\w\/_\.:\-]+\.css)(?:\?[^'|")]*)?(?:['|"]?)\s*\)\s*[;]?)/)[2];
			dw = path.resolve(dir, dw);
			pathArr.push(dw);
		});

		_.codes[item] = _combine(pathArr);

	});

	_.validateLog('Combine CSS', t.end());
	queue.next();
	return this;
}
/**
 * 静态文件版本号
 * @returns {exports|Function|Object|module.exports|Module.exports|sandbox.exports|*}
 */
_.staticVersion = function(){
	if(!_.config['STATIC_VERSION']){
		queue.next()
		return _;
	}
	var t = _.timing();
	// url 提取
	var regxUrl = /[^'";\(]+?\.(?:png|jpe?g|gif|ico|cur|css|js)(?:\?\w+\=\w+[\.\w+]+)?/ig;
	// ?v=xxx 提取
	var regxSuffix = /\?\w+\=\w+/g;
	// 合并所有文件
	var list = _.files.static.css.concat(_.files.combo.css, _.files.static.js,_.files.combo.js, _.files.static.html, _.files.tpl);
	list.forEach(function(item){
		var dir = Utils.path.dir(item);
		var code = _.codes[item];
		var relatives = code.match(regxUrl);
		if(!relatives) return;
		relatives.forEach(function(relative){
			var delVersion = relative.replace(regxSuffix, '');
			// 相对路径合并为绝对
			var absolute = path.resolve(dir, delVersion);
			// /xx/xx.js => c:\src\xx\xx.js
			if(relative.indexOf('/') == 0){
				absolute = Utils.path.absolute(_.config.STATIC_PATH, relative);
			}
			// 获取后缀
			var suffix = path.extname(absolute);
			// 提取内容
			var content = _.codes[absolute];
			if(!content){
				_.errorList.warn.push(relative + ' is not find ！');
				return
			}
			var md5 = Utils.text.md5(_.codes[absolute]);
			// 最终生成的路径为 ../../xx.jpg?v=fs22f.jpg
			_.codes[item] = _.codes[item].replace(relative, delVersion+'?v='+md5 + suffix);
		});
	});

	_.validateLog('Static version', t.end());
	queue.next();
	return this;
}

_.output = function(){
	Utils.file.cpdirSync(_.config.STATIC_PATH, _.config.STATIC_BUILD_PATH);
	Utils.file.cpdirSync(_.config.TPL_PATH, _.config.TPL_BUILD_PATH);

	var done = function(){
		queue.next()
	}

	var proxy = new EventProxy();
	proxy.all('static', 'tpl', done);

	// 静态文件处理
	var StaticList = _.files.static.css.concat(_.files.combo.css, _.files.static.js,_.files.combo.js, _.files.static.html);
	var staticLen = StaticList.length;
	StaticList.forEach(function(item){
		var outPath = item.replace(_.config.STATIC_PATH, _.config.STATIC_BUILD_PATH);
		var code = _.codes[item];
		Utils.file.writeFile(outPath, code, function(){
			staticLen--;
			if(!staticLen){
				proxy.emit('static');
			}
		});
	});

	// 模板处理
	var tplList = _.files.tpl;
	var tplLen = tplList.length;
	tplList.forEach(function(item){
		var outPath = item.replace(_.config.TPL_PATH, _.config.TPL_BUILD_PATH);
		var code = _.codes[item];
		Utils.file.writeFile(outPath, code, function(){
			tplLen--;
			if(!tplLen){
				proxy.emit('tpl');
			}
		})
	});
	return this;
}