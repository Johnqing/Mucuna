var csslint = require('./cssLint').CSSLint;
var x = 0;
module.exports = function(code){
	var error = '';
	var msg = csslint.verify(code).messages;
	if(msg.length){
		console.log(msg);
		for(var i=0; i<msg.length; i++){
			var e = msg[i];
			//console.log(e.rule.desc + '  cssList' + (x++))
			if(e){
				error += e.evidence || '';
				error += '\n Lint at line ' + e.line + '\n desc：' +	e.message + '\n browsers:' + e.rule.browsers + '\n';
				error += '\n';
			}
		}
	}
	return error;
}