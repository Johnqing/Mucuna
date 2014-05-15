var cssSprites = require('css-sprites');
var path = require('path');

module.exports = function(paths){
	var that = this;
	var conf = that.conf;
	paths.forEach(function(item){
		var dirname = path.dirname(item);
		cssSprites({
			src: item,
			dest: dirname,
			ext: '.css'
		},{
			imagepath: conf.SPRITE_SOURCE_PATH,
			spritedest: conf.SPRITE_DEST_PATH,
			spritepath: conf.SPRITE_CSS_PATH
		});

	});

}