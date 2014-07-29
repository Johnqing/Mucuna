var csslint = require('./cssLint').CSSLint;
module.exports = function(code){
	var error = '';
	var msg = csslint.verify(code).messages;
	if(msg.length){
		for(var i=0; i<msg.length; i++){
			var e = msg[i];
			if(e){
				error += e.evidence || '';
				error += '\n Lint at line ' + e.line + '\n desc：' +	e.message + '\n browsers:' + e.rule.browsers + '\n';
				error += '\n';
			}
		}
	}
	return error;
}