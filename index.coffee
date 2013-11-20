fs  = require 'fs'
sysConfig = require './config/sysConfig'
CleanCSS = require 'clean-css'
uglify = require "uglify-js"

pro = uglify.uglify
# minimized = CleanCSS.process source, options


base = 
	cwd: './'
	cfg: 'config.js'


errorLogs = 
	error: 0
	warning: 0

# 编译时是否发生warning

# if errorLogs.warning


exports.compile = (cwd, file) ->
	base.cwd = cwd.replace '\\', '/'
	base.cfg = file or base.cfg



	console.log pro
	return