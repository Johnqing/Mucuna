fs  = require 'fs'
sysConfig = require './config/sysConfig'

errorLogs = 
	error: 0
	warning: 0

# 编译时是否发生warning

# if errorLogs.warning


exports.compile = (file) ->
	console.log file
	return