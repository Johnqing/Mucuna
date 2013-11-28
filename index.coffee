fs  = require 'fs'
path = require 'path'
# 配置文件
fileHelper = require './lib/file'
# 文件处理
combo = require './lib/combo'
compress = require './lib/compress'

base = 
	cwd: './'
	cfg: 'config.js'


errorLogs = 
	error: 0
	warning: 0

usrConfig = null

# 文件路径和编译后代码
# key 文件路径
# value 编译后代码
filesCode = {}


# 获取用户配置
# 并且赋值
setUserSets = (path) ->
	data = fs.readFileSync path, 'utf-8'
	usrConfig = JSON.parse data
	return
# 编译入口
exports.compile = (cwd, file) ->
	base.cwd = cwd or cwd.replace '\\', '/'
	base.cfg = file or base.cfg

	setUserSets "#{base.cwd}/#{base.cfg}"
	# 当前文件目录
	filePath = "#{base.cwd}/#{usrConfig.static_path}"
	# 打包文件目录
	output = "#{base.cwd}/output/#{usrConfig.static_path}"
	# 获取需要打包文件夹下所有文件路径
	files = fileHelper.getAllFiles filePath
	# 在根目录下生成output
	fileHelper.mkdirSync output

	comboArr = []

	# 生成output下文件夹
	files.forEach (item)->

		itemArr = item.split "#{usrConfig.static_path}"
		oldPath = "#{usrConfig.static_path}#{itemArr[1]}"
		fNum = itemArr[1].lastIndexOf('/')
		folder = itemArr[1].substring 0, fNum

		fileType = path.extname item
		fileBaseName = path.basename item

		# 递归生成文件夹 
		newFolders = "#{output}#{folder}"
		fileHelper.mkdirSync newFolders, (e)->
			if e
				console.log e
			else 
				if itemArr[1].indexOf(usrConfig.combo_file) == -1
					newFile = "#{newFolders}/#{fileBaseName}"
					minCode = compress oldPath, newFile, fileType
					if minCode						
						fileHelper.writeFile newFile, minCode
						filesCode[newFile] = minCode

					console.log minCode
				else
					try
						code = fs.readFileSync oldPath, "utf8"
						opts = 
							folder: newFolders
							codes: code
							type: fileType
							name: fileBaseName
						comboArr.push opts
					catch e
						console.log e			
					
					
			return
		return
	# 合并
	console.log filesCode
	for cb in comboArr
		combo cb, filesCode
	
	return