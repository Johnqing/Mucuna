# 第三方包导入
uglify = require "uglify-js"

pro = uglify.uglify
# CleanCSS = require 'clean-css'
# minimized = CleanCSS.process source, options

###
*
* 
###
exports.compressJs = (text, useCache = false)->
	if not text
		return text

	