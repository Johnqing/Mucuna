# 文件路径过滤
DOT_RE = /\/\.\//g
DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
DOUBLE_SLASH_RE = /([^:/])\/\//g

module.exports = (path) ->
	# /a/b/./c/./d ==> /a/b/c/d
	path = path.replace DOT_RE, "/"

	# a/b/c/../../d  ==>  a/b/../d  ==>  a/d
	while path.match(DOUBLE_DOT_RE)
		path = path.replace DOUBLE_DOT_RE, "/"

	# a//b/c  ==>  a/b/c
	path = path.replace DOUBLE_SLASH_RE, "$1/"

	return path