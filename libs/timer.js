var Timer = module.exports = function(){
	this.sTime = +new Date();
}

Timer.prototype = {
	end: function(){
		var eTime = +new Date();
		var t = (eTime - this.sTime)/1000;
		return t;
	}
}