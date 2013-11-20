fs = require 'fs'
###
* mkdirSync
* @param {String} folderPath 路径
* @param {Number} mode 文件夹权限
* @param {Function} callback 回调
###
exports.mkdirSync = (folderPath, mode, callback) ->
	path = require "path"
	arr = folderPath.split "/"
	mode = mode or 0755;

	if arr[0] is "." 
		arr.shift();
	# 处理 ../ddd/d
	if arr[0] == ".."
		arr.splice 0, 2, arr[0]+"/"+arr[1]

	inner = (cur) ->
		# 不存在就创建一个
		if not path.existsSync cur
			fs.mkdirSync cur, mode
		if arr.length
			inner cur + "/"+arr.shift()
		else
			callback and callback()
	arr.length and inner arr.shift()