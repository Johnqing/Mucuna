fs  = require 'fs'

# 配置文件
mkdir = require './lib/mkdir'


base = 
	cwd: './'
	cfg: 'config.js'


errorLogs = 
	error: 0
	warning: 0

# 编译时是否发生warning

# if errorLogs.warning

userSetting = null

# 获取用户配置
# 并且赋值
setUserSets = (path) ->
	data = fs.readFileSync path, 'utf-8'
	userSetting = JSON.parse data
	return
# 编译入口
exports.compile = (cwd, file) ->
	base.cwd = cwd or cwd.replace '\\', '/'
	base.cfg = file or base.cfg

	setUserSets "#{base.cwd}/#{base.cfg}"

	console.log userSetting
	return