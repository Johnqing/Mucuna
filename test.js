var mucuna = require('./index')
var config = require('fs').readFileSync('./config.json');
var endCB = function(){
}
mucuna.init(process.cwd()).start(JSON.parse(config), endCB).handle([
	'checkDir',
	// findFiles 获取文件夹下，所以文件的路径和源码
	'findFiles',
	'validateHtml5',
	'validateJs',
	'validateCss',
	'htmlMin',
	'jsMin',
	'cssMin',
	'combineJS',
	'combineCss',
	'staticVersion'
]);