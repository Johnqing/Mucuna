fs = require 'fs'
# 第三方包导入
UglifyJS = require "uglify-js"
CleanCSS  = require 'clean-css'

minify = 
	js: (path)->
		return UglifyJS.minify(path).code
	css: (path)->
		code = fs.readFileSync path, "utf8"
		code = code.replace /\s/g, ''
		return new CleanCSS().minify code

module.exports = (path, type)->
	type = type.substring 1, type.length

	minify[type] path