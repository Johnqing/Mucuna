/**
 * 基础方法模块
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var logger = require('./logger');

//	私有变量
var DOT_RE = /\/\.\//g;
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//;
var DOUBLE_SLASH_RE = /([^:/])\/\//g;

var base = {}
/**
 * 文本处理
 */
base.text = {
	md5: function(text){
		var md5Text = crypto.createHash('md5').update(text).digest('hex')
		return md5Text.substring(md5Text.length-5);
	}
}
/**
 * 文件处理
 * @type {{realpath: realpath, walk: , mkdirSync: mkdirSync, readFile: readFile, readFileSync: readFileSync, writeFile: writeFile, cpdirSync: }}
 */
base.file = {
	/**
	 * 文件夹递归
	 */
	walk: function() {
		function collect(opts, el, prop) {
			if ((typeof opts.filter == "function") ? opts.filter(el) : true) {
				opts[prop].push(el);
				if (opts.one === true) {
					opts.filter = function() {
						return false;
					};
					opts.count = 0;
				}
			}
		}
		function sync(p, opts) {
			try {
				var stat = fs.statSync(p);
				var prop = stat.isDirectory() ? "dirs": "files";
				collect(opts, p, prop);
				if (prop === "dirs") {
					var array = fs.readdirSync(p);
					for (var i = 0, n = array.length; i < n; i++) {
						sync(path.join(p, array[i]), opts);
					}
				}
			} catch(e) {}
		};
		function async(p, opts) {
			opts.count++;
			fs.stat(p, function(e, s) {
				opts.count--;
				if (!e) {
					if (s.isDirectory()) {
						collect(opts, p, "dirs");
						opts.count++;
						fs.readdir(p, function(e, array) {
							opts.count--;
							for (var i = 0, n = array.length; i < n; i++) {
								async(path.join(p, array[i]), opts);
							}
							if (opts.count === 0) {
								opts.cb(opts.files, opts.dirs);
							}
						});
					} else {
						collect(opts, p, "files");
					}
					if (opts.count === 0) {
						opts.cb(opts.files, opts.dirs);
					}
				}
				if (e && e.code === "ENOENT") {
					opts.cb(opts.files, opts.dirs);
				}
			});
		};
		return function(p, cb, opts) {
			if (typeof cb == "object") {
				opts = cb;
				cb = opts.cb;
			}
			opts = opts || {};
			opts.files = [];
			opts.dirs = [];
			opts.cb = typeof cb === "function" ? cb: function(){};
			opts.count = 0;
			if (opts.sync) {
				sync(path.normalize(p), opts);
				opts.cb(opts.files, opts.dirs);
			} else {
				async(path.normalize(p), opts);
			}
		};
	}(),
	/**
	 * 创建目录,如果指定路径中有许多中间的目录不存在,也一并创建它们
	 * @param p 一个目录的路径，以“/”隔开
	 */
	mkdirSync: function(p) {
		p = path.normalize(p);
		var array = p.split(path.sep); //创建目录,没有则补上
		for (var i = 0, cur; i < array.length; i++) {
			if (i === 0) {
				cur = array[i];
			} else {
				cur += (path.sep + array[i]);
			}
			try {
				fs.mkdirSync(cur, "0755");
			} catch(e) {}
		}
	},
	/**
	 * 文件读取
	 * @param file
	 * @param encode
	 * @returns {*}
	 */
	readFile: function(file, encode){
		return fs.readFileSync(file, encode || 'utf-8');
	},
	/**
	 * 同步读取
	 * @returns {*|string|String}
	 */
	readFileSync: function(){
		// Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
		// because the buffer-to-string conversion in `fs.readFileSync()`
		// translates it to FEFF, the UTF-16 BOM.
		var content = fs.readFileSync.apply(fs, arguments).toString();
		if (content.charCodeAt(0) === 0xFEFF) {
			content = content.slice(1);
		}
		return content;
	},
	/**
	 * 文件写入
	 * @param file
	 * @param content
	 */
	writeFile: function(file, content, encode, fn){
		if(typeof encode == 'function'){
			fn = encode;
			encode = void 0;
		}

		fs.open(file, "w", 0666, function(e, fd){
			if(e) throw e;
			fs.write(fd, content, 0, (encode || 'utf-8'), function(e){
				if(e) throw e;
				fn && fn();
				fs.closeSync(fd);
			});
		});
	},
	/**
	 * 文件拷贝，（跨分区）
	 */
	cpdirSync: function() {

		function writeFile(from, to, callback){
			var input = fs.createReadStream(from);
			var output = fs.createWriteStream(to);

			input.on("data", function(d) {
				return output.write(d);
			});

			input.on("error", function(error) {
				callback && callback(error);
			});
			input.on("end", function() {
				output.end();
				callback && callback(null);
			});
		}

		function inner(old, neo) {
			var array = fs.readdirSync(old);
			for (var i = 0, n = array.length; i < n; i++) {
				var source = array[i];
				var source = path.join(old, source.replace(old, ""));
				var target = path.join(neo, source.replace(old, ""));

				var stat = fs.statSync(source); //判定旧的IO对象的属性，是目录还是文件或是快捷方式
				if (stat.isDirectory()) {
					// 目录不存在直接创建
					if (!fs.existsSync(target))
						base.file.mkdirSync(target);

					inner(source, target);
				} else if (stat.isSymbolicLink()) {
					fs.symlinkSync(fs.readlinkSync(source), target);
				} else {
					writeFile(source, target);
					//fs.writeFileSync(target, base.file.readFileSync(source));
				}
			}
		}
		return function(old, neo, cb) { //把当前目录里面的东西拷贝到新目录下（不存在就创建）
			old = path.resolve(process.cwd(), old);
			neo = path.resolve(process.cwd(), neo); //允许拷贝到另一个分区中
			if (!fs.existsSync(neo)) { //创建新文件
				base.file.mkdirSync(neo);
			}
			inner(old, neo);
			if (typeof cb == "function") {
				cb();
			}
		};
	}()
}

base.path = {
	/**
	 * 相对路径修复
	 * @param path
	 * @returns {XML|string}
	 */
	realpath: function(path){
		path = this.win2unix(path);
		// /a/b/./c/./d ==> /a/b/c/d
		path = path.replace(DOT_RE, "/")

		// a/b/c/../../d  ==>  a/b/../d  ==>  a/d
		while (path.match(DOUBLE_DOT_RE)) {
			path = path.replace(DOUBLE_DOT_RE, "/")
		}
		// a//b/c  ==>  a/b/c
		path = path.replace(DOUBLE_SLASH_RE, "$1/")

		return path
	},
	/**
	 * window下的路径转为unix下
	 * @param p
	 * @returns {XML|string|void}
	 */
	win2unix: function(p){
		return p.replace(/\\/g, '/');
	},
	/**
	 * 最后一个文件夹的名称
	 * @param p
	 * @returns {*}
	 */
	lastDir: function(p){
		var pArr = this.dir(p).split(path.sep);
		var last = pArr[pArr.length-1];
		return last;
	},
	/**
	 * 目录转换为数组
	 * @param p
	 * @returns {Array}
	 */
	dir: function(p){
		var pArr = p.split(path.sep);
		var last = pArr[pArr.length-1];
		// 结尾包含.xx 的 直接踢出去
		/\.\w+/.test(last) && pArr.pop();
		return pArr.join(path.sep);
	},

	/**
	 * src下的路径转为output下的
	 * @param src
	 * @param conf
	 */
	src2build: function(src, conf){
		var s = this.win2unix(src);
		var sl = this.lastDir(conf.STATIC_PATH);
		var bl = this.lastDir(conf.BUILD_PATH);
		s = s.replace(sl, bl + '/' + sl);
		return path.normalize(s);
	}
}

base.config = {
	init: function(confPath){
		confPath = confPath || './config.json';
		var cwd = process.cwd();
		// 获取配置文件
		var config = JSON.parse(base.file.readFile(confPath));
		config.S_BUILD_PATH = path.resolve(cwd, config.BUILD_PATH + '/' + config.STATIC_PATH);
		config.T_BUILD_PATH = path.resolve(cwd, config.BUILD_PATH + '/' + config.TPL_PATH);
		config.SPRITE_SOURCE_PATH = config.BUILD_PATH + '/' + config.SPRITE_SOURCE_PATH;
		config.SPRITE_DEST_PATH = config.BUILD_PATH + '/' + config.SPRITE_DEST_PATH
		config.STATIC_PATH = path.resolve(cwd, config.STATIC_PATH);
		config.TPL_PATH = path.resolve(cwd, config.TPL_PATH);

		return config;
	},
	/**
	 * 掺合对象
	 * @param oldObj
	 * @param newObj
	 */
	mixin: function(oldObj, newObj){
		for(var key in newObj){
			oldObj[key] = newObj[key];
		}
	}
}

module.exports = base;
