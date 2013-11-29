fs  = require 'fs'
path = require 'path'
# 配置文件
fileHelper = require './lib/file'
# 文件处理
combo = require './lib/combo'
compress = require './lib/compress'

global.base = 
	cwd: './'
	cfg: 'config.js'
	htmlTpl: 'html'


global.errorLogs = 
	error: 0
	warning: 0
	log: []
	logFn: (e)->
		@log.push e
		@error++

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
# 剔除不需要编译的文件
isNotCompile = (type)->
	if not usrConfig.html_combine and type is global.base.htmlTpl
		return true
	if not usrConfig.js_combine and type is 'js'
		return true
	if not usrConfig.css_combine and type is 'css'
		return true
	if not usrConfig.img_combine and /jpg|jpeg|png|gif/g.test type
		return true

# 编译入口
exports.compile = (cwd, file) ->
	global.base.cwd = cwd or cwd.replace '\\', '/'
	global.base.cfg = file or global.base.cfg

	# 所有配置文件会被添加到 usrConfig
	setUserSets "#{global.base.cwd}/#{global.base.cfg}"
	global.base.htmlTpl = usrConfig.htmlTpl
	# 当前文件目录
	filePath = "#{global.base.cwd}/#{usrConfig.static_path}"
	# 打包文件目录
	output = "#{global.base.cwd}/output/#{usrConfig.static_path}"
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
		# 去除点
		fileType = fileType.substring 1, fileType.length
		fileBaseName = path.basename item

		# 剔除不需要编译的文件
		if isNotCompile fileType
			return
		# 递归生成文件夹 
		newFolders = "#{output}#{folder}"
		fileHelper.mkdirSync newFolders, (e)->
			if e
				global.errorLogs.logFn e
			else 
				if itemArr[1].indexOf(usrConfig.combo_file) == -1					
					newFile = "#{newFolders}/#{fileBaseName}"
					minCode = compress oldPath, newFile, fileType

					if minCode						
						fileHelper.writeFile newFile, minCode
						filesCode[newFile] = minCode

				else
					try
						code = fs.readFileSync oldPath, "utf8"
						opts = 
							folder: newFolders
							codes: code
							type: fileType
							name: fileBaseName
						comboArr.push opts
					catch er
						global.errorLogs.logFn er		
					
					
			return
		return
	# 合并
	console.log filesCode
	for cb in comboArr
		combo cb, filesCode
	# 显示错误信息
	console.log global.errorLogs.log
	console.log global.errorLogs.error

	return