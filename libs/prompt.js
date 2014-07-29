var fs = require('fs');
var read = require('read');

var log = require('./log')

exports.prompt = function(prompts, done){
	prompts = Array.isArray(prompts) ? prompts : [prompts];
	var results = {};

	(function next(prompt){
		if(!prompt){
			return done(null, results);
		}

		if(!prompt.prompt){
			prompt.prompt = prompt.message.red;
		}

		read(prompt, function(err, value) {
			if (err) {
				return done(err);
			}
			results[prompt.name] = value;
			next(prompts.shift());
		});

	})(prompts.shift());

	return this;
}

/**
 * 解析txt文件命令
 * @return {[type]} [description]
 */
exports.parseFile = function(txt) {
	var lines = txt.split(/\n/);
	var prop = {};
	var reg = /^\[\?\]\s?([^\(]+)\(([^\)]+)\)\s*\|\s([\w\d\-_\/]+)/;
	var prompts = lines.map(function(line) {
		line = line.trim();
		if (!line || !/^\[\?\]/.test(line)) {
			log.log('[' + line + '](green)');
			return;
		}
		var m = line.match(reg);
		if (!m) {
			log.log('[' + line + '](green)');
			return;
		}
		var prompt = {
			message: m[1].trim(),
			'default': m[2].trim(),
			name: m[3].trim()
		};
		return prompt;
	});
	return prompts.filter(function(p) {
		return p;
	});
};