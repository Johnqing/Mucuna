fs = require 'fs'
rootPath = process.argv[2]
path = require "path"
###
* getAllFiles
* @param {String} root 路径
* @param {Function} callback 回调
###
exports.getAllFiles = getAllFiles = (root, callback) ->
	res = []
	files = fs.readdirSync root
	files.forEach (file)->
		pathname = "#{root}/#{file}"
		stat = fs.lstatSync pathname

		if not stat.isDirectory()
			res.push pathname.replace(rootPath, '.')
		else
			res = res.concat getAllFiles(pathname)
	return res
###
* mkdirSync
* @param {String} folderPath 路径
* @param {Number} mode 文件夹权限
* @param {Function} callback 回调
###
exports.mkdirSync = (folderPath, mode, callback) ->
	arr = folderPath.split "/"
	# mode 为function的时候
	# mode = 0755
	if typeof mode == 'function'
		callback = mode
		mode = '0755'

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
		return
	arr.length and inner arr.shift()
	return

# 写入文件
exports.writeFile = (file, codes, callback)->
	fs.open file, "w", "0644", (e, fd) ->
		if e
			throw e
		fs.writeSync fd, codes, 0, 'utf8', (e)->
			if e
				throw e
			fs.closeSync fd
			callback and callback
			return
		return
	return
###
* 复制文件
* @param {String} from 文件源
* @param {String} to 目标文件
* @param {Function} callback 回调
###
exports.copy = (from, to, callback) ->
	# 输入流
	input = fs.createReadStream from
	# 输出流
	output = fs.createWriteStream to
	# 把输入复制到输出
	input.on "data", (d)->
		output.write d
	# 错误提示
	input.on "error", (error)->
		console.log error
		return
	
	input.on "end", ->
		# 当输入结束
		output.end()
		callback and callback()
		return
	return