crypto = require 'crypto'
fs = require 'fs'
# 配置文件正则
conf = require '../config/sysConfig'
# 第三方包导入
UglifyJS = require "uglify-js"
CleanCSS  = require 'clean-css'
smushit = require 'node-smushit'

fileHelper = require './file'

md5 = (str) ->
    md5sum = crypto.createHash 'md5'
    md5sum.update str
    str = md5sum.digest 'hex'
    return str


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
	html: (form, target)->

		html = fs.readFileSync form, "utf8"
		html_v_arr = html.match conf.HTML_V_PATH

		console.log html_v_arr

		for i in html_v_arr

			path = i.match /(src|href)=['"]?([^'"]*)['"]?/i

			staticFile = fs.readFileSync form, "utf8"
			vStr = md5 staticFile
			vStr = vStr.substring vStr.length-8, vStr.length
			if i.indexOf('?v=') isnt -1
				ver = i.replace /(v=).*&/, "v=#{vStr}&"
			else
				ver = "#{i}?v=#{vStr}"
			html = html.replace i, ver


		fileHelper.writeFile target, html

		return


module.exports = (form, target, type)->
	# js|css
	if /js|css/.test type
		return minify[type] form
	# img
	if /jpg|jpeg|gif|png/.test type
		minify['img'] form, target
	# html
	if global.base.htmlTpl is type
		minify[type] form, target
