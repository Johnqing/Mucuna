var path = require('path');

var logger = require('../logger');
var unit = require('../base');
var smushit = require('node-smushit');

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
		// 图片优化
		if(conf.OPTIMIZE_IMG){
			smushit.smushit(item, {
				verbose: false,
				onItemComplete: function(e){
					if(e){
						logger.error(e);
						return;
					};
				}
			});
		}

	});

	return miniCache;

}


module.exports = img;