fs = require 'fs'
# 第三方包导入
UglifyJS = require "uglify-js"
CleanCSS  = require 'clean-css'
smushit = require 'node-smushit'

fileHelper = require './file'

minify = 
	js: (path)->
		return UglifyJS.minify(path).code
	css: (path)->
		code = fs.readFileSync path, "utf8"
		code = code.replace /\s/g, ''
		return new CleanCSS().minify code
	img: (form, target) ->
		fileHelper.copy form, target, ->
			smushit.smushit target


module.exports = (form, target, type)->
	type = type.substring 1, type.length
	# js|css
	if /js|css/.test type
		return minify[type] form
	# img
	if /jpg|jpeg|gif|png/.test type
		minify['img'] form, target
