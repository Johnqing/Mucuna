/**
 * jsLint 模块
 */

var jsLint = require('./jsLint');

module.exports = function(code, config){
	var error = '';
	if(!jsLint(code, config)){
		for(var i=0; i<jsLint.errors.length; i++){
			var e = jsLint.errors[i];
			if(e){
				error += 'Lint at line ' + e.line + ' character ' +	e.character + ': ' + e.reason + '\n';
				error += (e.evidence || '').replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1");
				error += '\n';
			}
		}
	}
	return error;
}