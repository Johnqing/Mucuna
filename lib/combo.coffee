fs = require 'fs'
# 配置文件正则
sysConfig = require '../config/sysConfig'

fileHelper = require './file'

realpath = require './realpath'


combo = 
	js: (opts, fileList)->
		codes = opts.codes

		srcPath = codes.match sysConfig.SCRIPT_FILE_PATH
		srcPath = realpath "#{opts.folder}/#{srcPath[2]}"

		codes = codes.replace /\s/g, ''
		codes = codes.replace /document\.write/g, '\ndocument.write'

		srcStr = codes.replace sysConfig.COMBINE_SCRIPT_PATH, '|$1'
		srcArr = srcStr.split '|'
		srcArr.shift()

		codeArr = []

		for i in srcArr
			minCode = fileList["#{srcPath}#{i}"]
			codeArr.push minCode

		return codeArr.join ''

	css: (opts, fileList) ->
		codes = opts.codes
		srcStr = codes.replace sysConfig.COMBINE_CSS_PATH, '$2|'

		srcArr = srcStr.split '|'
		srcArr.pop()

		codeArr = []

		for i in srcArr
			i = i.replace /\r\n/g, ''
			cur = realpath "#{opts.folder}/#{i}"
			minCode = fileList[cur]
			codeArr.push minCode

		return codeArr.join ''

module.exports = (opts, fileList)->
	type = opts.type
	if type is 'js' or type is 'css'
		# 写入合并文件
		codes = combo[type] opts, fileList

		fileHelper.writeFile "#{opts.folder}/#{opts.name}", codes