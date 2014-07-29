'use strict';

var _ = require('./util'),
	analytihtml = require('./analytic');

module.exports.compress = function(content, options){
	var htmlCompress = new HTMLCompress(content, options);
	return htmlCompress.compress();
};

function HTMLCompress(content, options){
	this.content = content;
	this._output = [];
	this._tokenText = '';
	this.leftDelimiter = options.leftDelimiter? options.leftDelimiter : '{%';
	this.rightDelimiter = options.rightDelimiter? options.rightDelimiter : '%}';
	this.level = options.level? options.level : 'strip';
	this.jsMin = options.jsMin;
	this.cssMin = options.cssMin;

	/**
	 *
	 * 单一标签，这些标签不需要对应的闭合标签
	 * @var array
	 */
	this._singleTag = [
		"br", "input", "link", "meta", "!doctype", "basefont", "base",
		"area", "hr", "wbr", "param", "img", "isindex", "?xml", "embed"
	];

	/**
	 *
	 * 可删除的闭合标签
	 * @var array
	 */
	this._removeEndTag = [
		"html", "body", "colgroup", "thead", "tr", "tbody", "td",
		"dt", "dd", "li", "option", "tfoot"
	];
	/**
	 *
	 * 块级元素，2个块级元素之间的空格是可以删除的
	 * @var array
	 */
	this._blockElements = [
		'address','blockquote','center','dir','div','dl','fieldset','form',
		'h1','h2','h3','h4','h5','h6','hr','menu','noframes','noscript',
		'ol','p','pre','table','ul'
	];
	/**
	 *
	 * 标签属性默认值,这些默认指是可以删除的
	 * @var array
	 */
	this._tagAttrDefaultValue = {
		'*' : {
			'class' : '',
			'alt' : ''
		},
		'link' : {
			'media' : 'screen'
		},
		'input' : {
			//'type' => 'text'
		},
		'form' : {
			'method' : 'get'
		},
		'script' : {
			'type' : 'text/javascript',
			'fcpcompress' : ''
		}
	};

	this._tagAttrOnlyName = [
		'disabled','selected','checked', 'readonly', 'multiple'
	];
}

HTMLCompress.prototype.compress = function(){
	var analyticContent = analytihtml.parse(this.content, 1, this.leftDelimiter, this.rightDelimiter);
	for (var i = 0, count = analyticContent.length; i < count; i++){
		this._tokenText = String(analyticContent[i][0]);
		var tokenType = analyticContent[i][1];
		//将连续的换行进行剔除，只留一个换行
		if ( this._output[this._output.length-1] == '\n' && tokenType === _.sign.FL_NEW_LINE){
			continue;
		}
		switch (tokenType){
			case _.sign.HTML_COMMENT : break;
			case _.sign.HTML_CONTENT:
				if(this.level != "strip_comment"){
					this._compressTextContent();
				}else{
					this._output[this._output.length] = this._tokenText;
				}
				break;
			case _.sign.HTML_TAG_END :
				if(this.level=="compress"){
					if (!_.in_array(_.trim(_.trim(this._tokenText, '<>/')), this._removeEndTag)){
						this._output[this._output.length] = this._tokenText;
					}
				}else{
					this._output[this._output.length] = this._tokenText;
				}
				break;
			case _.sign.HTML_TAG_START :
			case _.sign.HTML_JS_START:
				if(this.level=="compress" && !this.isDelimiterScriptStart(tokenType)){
					this._compressTag();
				}else{
					this._output[this._output.length] = this._tokenText;
				}
				break;
			case _.sign.HTML_CSS_CONTENT :
				if(this.cssMin){
					this._output[this._output.length] = this.cssMin(this._tokenText);
				}
				break;
			case _.sign.HTML_JS_CONTENT :
				if(this.jsMin){
					this._output[this._output.length] = this.jsMin(this._tokenText);
				}
				break;
			case _.sign.FL_TPL_DELIMITER:
				var text = this._tokenText;
				if (text.indexOf('extends') !== -1){ //smarty3里extends后至少要加个空白字符
					text += ' ';
				}
				this._output[this._output.length] = text;
				break;
			default:
				this._output[this._output.length] = this._tokenText.replace(/\n/g, '');
		}
	}
	return this._output.join('');
};

HTMLCompress.prototype._compressTextContent = function(){
	//如果内容部完全是空格,将多个空格合并为一个空格
	if (this._tokenText !== ''){
		//如果内容里还有//，有可能含有注释，则不能去掉换行
		if (this._tokenText.indexOf('//') !== -1){
			this._output[this._output.length] = this._tokenText;
			return true;
		}
		var beReplaceContent = '';
		if(this.level == 'strip:space'){
			beReplaceContent = " ";
		}
		this._tokenText = _.trim(_.str_replace(["\r","\n","\t"], beReplaceContent, this._tokenText));
		if(this._tokenText !== ''){
			this._output[this._output.length] = this._tokenText;
		}
	}
};


HTMLCompress.prototype._compressTag = function(){
	var result = analytihtml.parse(this._tokenText, 2, this.leftDelimiter, this.rightDelimiter);

	if (result[0] === _.sign.HTML_TAG_END){
		this._output[this._output.length] = '</' + result[1] + '>';
		return true;
	}
	var resultString = '<' + result[1];
	if (result[2].length){
		var blankSpace = ' ';
		var chPattern = this._tagAttrDefaultValue['*'];
		if (_.is_array(this._tagAttrDefaultValue[result[1]])){
			chPattern = _.array_merge(chPattern, this._tagAttrDefaultValue[result[1]]);
		}

		for(var i = 0; i < result[2].length; i++){
			var item = result[2][i];
			resultString = _.rtrim(resultString);
			//先进行压缩：属性或者属性值去除
			var v = _.trim(item[1],"'\"");
			var tv = chPattern[item[0]];
			//如果值在默认可去除的值范围内，则将该属性去除
			if (v === tv){
				continue;
			}
			//如果值内没有一些特殊字符，可以将两边的引号去除
			if (/^[\w\-\/\:\.\?\=]+$/.test(v)){
				resultString += blankSpace + item[0] + '=' + v;
				continue;
			}

			//smarty变量
			if (item[0] === _.sign.HTML_TPL_ATTR_NAME){
				resultString += blankSpace + item[1];
				continue;
			}
			//只要属性名的，属性值可以省略的
			if (_.in_array(item[0], this._tagAttrOnlyName)){
				resultString += blankSpace + item[0];
				continue;
			}
			//only attr,no value.such as "disabled"
			if (!_.strlen(item[1])){
				resultString += blankSpace + item[0];
				continue;
			}
			resultString += blankSpace + item[0] + '=' + item[1];
		}
	};
	resultString += '>';
	this._output[this._output.length] = resultString;
};

HTMLCompress.prototype.isDelimiterScriptStart = function(tokenType){
	if(tokenType == _.sign.HTML_JS_START
		&& this._checkEqual(this._tokenText, 0, this.leftDelimiter.length + 6, this.leftDelimiter + 'script')){
		return true;
	}
	return false;
}

HTMLCompress.prototype._checkEqual = function(str, start, len, result){
	return str.substr(start, len).toLowerCase() === result.toLowerCase();
};