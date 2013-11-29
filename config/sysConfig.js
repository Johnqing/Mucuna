module.exports = {
	'STATIC_SUBDIRS_LIST': ['js', 'css', 'img', 'html', 'other'],
	'HTML_V_PATH': /(<style.*?url\([\'\"]|<(?:link|script).*?(?:href|src)=[\"\'])([^\'\"]+)/ig,
	'SCRIPT_FILE_PATH': /var\s+srcPath\s*\=\s*(\'|\")([\w\-\/\.]+)\1/i,
	'COMBINE_SCRIPT_PATH': /\s*document\.write.*srcPath[^'\"]+['\"]([^'\"]*\.js)['\"].*/ig,
	'COMBINE_CSS_PATH': /(@import\s+url\((?:[\'\"]?)([\w\/_\.\:\-]+\.css)(?:[\'\"]?)\)\s*[;]?)/ig
};
