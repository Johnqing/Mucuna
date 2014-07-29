var Queue = module.exports = function(){
	this.lists = [];
}
var i=0
Queue.prototype = {
	constructor: Queue,
	add: function(fn){
		this.lists.push(fn);
		return this;
	},
	next: function(){
		var self = this;
		var lists = self.lists;
		var item = lists.shift() || function(){};
		item.call(self);
	}
}