var path = require('path');

var logger = require('../logger');
var unit = require('../base');

var img = function(imgList){
	var conf = this.conf;

	var miniCache = {};

	imgList.forEach(function(item){
		var fPath = item.replace(path.sep + conf.BUILD_PATH, '');

		var content = unit.file.readFile(item);

		// 收集到缓存对象中
		miniCache[item] = {
			code: content,
			defPath: fPath,
			vs: unit.text.md5(content)
		};
	});

	return miniCache;

}


module.exports = img;