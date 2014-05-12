/**
 * 
 * html词法分析类
 * 对原内容进行分析，不做任何trim处理
 * 
 */
'use strict';

module.exports = {
  parse: function(content, type, leftDelimiter, rightDelimiter){
      var html = new AnalyticHtml();
      return html.parse(content, type, leftDelimiter, rightDelimiter);
  }  
};
var _ = require('./util.js');

function AnalyticHtml(){
    /**
	 * 
	 * 当前解析到的位置
	 * @var int
	 */
	this.parsePos = 0;
	
	/**
	 * 
	 * 要解析的内容
	 * @var string
	 */
	this.content = '';
	/**
	 * 
	 * 要解析的内容长度
	 * @var int
	 */
	this.contentLength = 0;
    /**
     *
     * @type {Array}
     */
    this.delimiterScriptStart = '';
    this.delimiterScriptEnd = '';
    /**
	 * 
	 * 单个标签
	 * @var new Array
	 */
	this.singleTag = [
        "br", "input", "link", "meta", "!doctype", "basefont", "base", 
		"area", "hr", "wbr", "param", "img", "isindex", "?xml", "embed"
    ];
	/**
	 * 
	 * 解析后的token存放处
	 * @var new Array
	 */
	this._output = [];
    this.leftDelimiter = '{%';
	this.rightDelimiter = '%}';
}

AnalyticHtml.prototype.parse = function(content, type, leftDelimiter, rightDelimiter){
    this.content = content;
    this.leftDelimiter = leftDelimiter;
    this.rightDelimiter = rightDelimiter;
    this.delimiterScriptStart = leftDelimiter + 'script';
    this.delimiterScriptEnd = leftDelimiter + '/script' + rightDelimiter;
    
    if (this.content.indexOf && this.content.indexOf('<?xml') !== -1){
        return new Array([content, _.sign.HTML_XML]);
    }
    this.contentLength = this.content.length;
    if (type === 1){
        this.tokenAnalytic();
        return this._output;
    }else if (type === 3){//分割属性值为数组
        return this.splitAttributeValue(content);
    }
    return this.getTagAttributes(content);
};

/**
 * 分析字符
 */
AnalyticHtml.prototype.tokenAnalytic = function(){
    while (true){
        var token = this.getNextToken();
        if (token){
            if (token[1] === _.sign.FL_EOF) break;
            this._output[this._output.length] = token;
        }
    }
};

/**
 * 解析成不同类型的片段组合
 * @return {*}
 */
AnalyticHtml.prototype.getNextToken = function(){
    if (this.parsePos >= this.contentLength){
			return new Array('', _.sign.FL_EOF);
		}
		var str = this.content[this.parsePos],
            result;
		this.parsePos++;
		var outputCount = this._output.length;
		if (outputCount){
			var tokenType = this._output[outputCount - 1][1];
            var tokenValue = this._output[outputCount - 1][0];
			if ( tokenType === _.sign.HTML_JS_START){
                var scriptEnd = '</script>';
                if(this._checkEqual(tokenValue, 0, this.leftDelimiter.length + 6, this.delimiterScriptStart)){
                    scriptEnd = this.delimiterScriptEnd;
                }
                result = this._getScriptORSTYLE(str, scriptEnd, 1);
				if (result) return result;
			}else if (tokenType === _.sign.HTML_CSS_START){
				result = this._getScriptORSTYLE(str, '</style>', 2);
				if (result) return result;
			}
		}
		if (str === "\x0d") return ''; // \r
		if (str === "\x0a"){
			return new Array(str, _.sign.FL_NEW_LINE);
		}
		//处理模板左右定界符,如果是smarty变量则直接返回
		result = _.getTplDelimiterToken.call(this);
		if (result){
            //单独针对script插件类型处理
            if(this._checkEqual(result[0], 0, this.leftDelimiter.length + 6, this.delimiterScriptStart)){
                result[1] = 113;
            }else if(this._checkEqual(result[0], 0, this.leftDelimiter.length + 7 + this.rightDelimiter.length, this.delimiterScriptStart)){
                result[1] = 115;
            }
            return result
        };
		//处理pre标签，pre标签里任何内容都直接通过，不做任何处理
		if (this._checkEqual(this.content, this.parsePos - 1, 4, '<pre')){
			this.parsePos += 3;
			result = this._getPreTagToken();
			if (result) return result;
		}
		//处理textarea标签，textarea标签里任何内容都直接通过，不做任何处理
		if (this._checkEqual(this.content, this.parsePos - 1, 9, '<textarea')){
			this.parsePos += 8;
			result = this._getTextareaTagToken();
			if (result) return result;
		}
		//处理一般性的标签,当前字符为<并且下一个字符不为<
		if (str === '<' && this.content[this.parsePos] !== '<'){
			result = this._getTagToken(str);
			if (result) return result;
		}
		result = this._getContentToken(str);
		if (result) return result;
		return new Array(str, _.sign.FL_NORMAL);
};

/**
 * 以<开头，获取整个标签
 * @param str
 * @return {Array}
 * @private
 */
AnalyticHtml.prototype._getTagToken = function(str){
    var resultString = str;
    do {
        if (this.parsePos >= this.contentLength){
            break;
        }
        str = this.content[this.parsePos];
        
        this.parsePos++;
        var result = _.getTplDelimiterToken.call(this);
        if (result){
            resultString += result[0];
        }else {
            if (str === '"' || str === "'"){
                if (resultString[1] !== '!'){
                    //处理value="<&if test=""&>1<&else&>0<&/if&>"的情况
                    this.parsePos++;
                    result = _.getTplDelimiterToken.call(this);
                    resultString += str;
                    if (result){
                        resultString += result[0];
                    }else {
                        this.parsePos--;
                    }
                    resultString += this._getUnformated(str, '');
                }else{
                    resultString += str;
                }
            }else {
                resultString += str;
            }
        }
    }while (str !== '>');
    //注释或者ie hack
    if (resultString[1] === '!'){
        if (resultString.indexOf('[if') !== -1){
            if (resultString.indexOf('!IE') !== -1){
                resultString += this._getUnformated('-->', resultString);
            }
            return new Array(resultString, _.sign.HTML_IE_HACK_START);
        }else if (resultString.indexOf('[endif') !== -1){
            return new Array(resultString, _.sign.HTML_IE_HACK_EDN);
        }else if (this._checkEqual(resultString, 2, 7, 'doctype')){
            return new Array(resultString, _.sign.HTML_DOC_TYPE);
        }else if(this._checkEqual(resultString, 4, 6, 'status')){
            resultString += this._getUnformated('-->', resultString);
            return new Array(resultString, _.sign.HTML_STATUS_OK);
        }else {
            resultString += this._getUnformated('-->', resultString);
            return new Array(resultString, _.sign.HTML_COMMENT);
        }
    }
    if (this._checkEqual(resultString, 0, 7, '<script')){
        return new Array(resultString, _.sign.HTML_JS_START);
    }else if (this._checkEqual(resultString, 0, 9, '</script>')){
        return new Array(resultString, _.sign.HTML_JS_END);
    }else if (this._checkEqual(resultString, 0, 6, '<style')){
        return new Array(resultString, _.sign.HTML_CSS_START);
    }else if (this._checkEqual(resultString, 0, 8, '</style>')){
        return new Array(resultString, _.sign.HTML_CSS_END);
    }
    if (this._checkEqual(resultString, 0, 2, '</')){
        return new Array(resultString, _.sign.HTML_TAG_END);
    }
    return new Array(resultString, _.sign.HTML_TAG_START);
};

AnalyticHtml.prototype._checkEqual = function(str, start, len, result){
    return str.substr(start, len).toLowerCase() === result.toLowerCase();
};

/**
 * 获取pre标签内容
 * @return {Array}
 * @private
 */
AnalyticHtml.prototype._getPreTagToken = function(){
    var resultString = '<pre';
    while (this.parsePos < this.contentLength){
        if (this.content.substr(this.parsePos, 6).toLowerCase() === '</pre>'){
            resultString += '</pre>';
            this.parsePos += 6;
            break;
        }else{
            resultString += this.content[this.parsePos];
            this.parsePos++;
        }
    }
    return [resultString, _.sign.HTML_PRE_TAG];
};

/**
 * 获取textarea内容
 * @return {Array}
 * @private
 */
AnalyticHtml.prototype._getTextareaTagToken = function(){
    var resultString = '<textarea';
    while (this.parsePos < this.contentLength){
        if (this.content.substr(this.parsePos, 11).toLowerCase() === '</textarea>'){
            resultString += '</textarea>';
            this.parsePos += 11;
            break;
        }else{
            resultString += this.content[this.parsePos];
            this.parsePos++;
        }
    }
    return [resultString, _.sign.HTML_TEXTAREA_TAG];
};

/**
 * 计算标签之间的内容
 * @param str
 * @return {Array}
 * @private
 */
AnalyticHtml.prototype._getContentToken = function(str){
    var resultString = str;
    while (true){
        if (this.parsePos >= this.contentLength){
            break;
        }
        //增加对<a href=""><<<</a>的兼容，此时内容为<<<
        if (this.content[this.parsePos] === '<' 
            && this.content[this.parsePos+1] 
            && this.content[this.parsePos+1] !== '<' 
            && this.content[this.parsePos+1] !== '>'){
            break;
        }
        if(this.content.substr(this.parsePos, this.leftDelimiter.length) === this.leftDelimiter){
            break;
        }
        resultString += this.content[this.parsePos];
        this.parsePos++;
    }
    return [resultString, _.sign.HTML_CONTENT];
};

AnalyticHtml.prototype._getUnformated = function(str, orign){
    if ((orign + '').indexOf(str) !== -1) return '';
    var resultString = '';
    var len = str.length;
    do {
        if (this.parsePos >= this.contentLength){
            break;
        }
        var c = this.content[this.parsePos];
        this.parsePos++;
        var re = _.getTplDelimiterToken.call(this);
        if(re){
            resultString += re[0];
        }else{
            resultString += c;
        }
        if(len > 1 && resultString.indexOf(str) !== -1){
            break;
        }
        if(len ===1 && c === str){
            break;
        }
    }while (true);
    //增加一个字符的容错机制,如：value="""，这里一不小心多写了个引号
    if (str.length === 1){
        while (str === this.content[this.parsePos]){
            resultString += this.content[this.parsePos];
            this.parsePos++;
        }
    }
    return resultString;
};
/**
 * 获取script片段代码
 * @param str
 * @param type
 * @return {*}
 * @private
 */
AnalyticHtml.prototype._getScriptORSTYLE = function(str, tokenText, type){
    var tokenLength = tokenText.length;
    if (this.content.substr(this.parsePos - 1, tokenLength).toLowerCase() === tokenText){
        return '';
    }
    var resultString = str;
    while (this.parsePos < this.contentLength){
        if (this.content.substr(this.parsePos, tokenLength).toLowerCase() === tokenText){
            break;
        }else {
            resultString += this.content[this.parsePos];
            this.parsePos++;
        }
    }
    var startEscape = ['<!--', '/*<![CDATA[*/', '//<![CDATA['];
    var endEscape = ['//-->', '/*]]>*/', '//]]>'],
        escape ;
    for(var i = 0 ; i < startEscape.length ;i++){
        escape = startEscape[i];
        if (resultString.indexOf(escape) === 0){
            resultString = resultString.substr(escape.length);
            break;
        }
    }
    
    for(var i = 0 ; i < endEscape.length ;i++){
        escape = endEscape[i];
        if (resultString.indexOf(escape) === (resultString.length - escape.length)){
            resultString = resultString.substr(0, resultString.length - escape.length);
            break;
        }
    }
    return [resultString, type === 1 ? _.sign.HTML_JS_CONTENT : _.sign.HTML_CSS_CONTENT];
};

/**
 * 获取标签内属性键值对
 * @param tagContent
 * @return {Array}
 */
AnalyticHtml.prototype.getTagAttributes = function(tagContent){
    //tag end
    tagContent = _.trim(tagContent + '');
    //将还行符替换为空格
    tagContent = _.str_replace(["\r\n", "\r", "\n", "\t"], ' ', tagContent);
    if (tagContent.substr(0, 2) === '</') {
        return [ 
                _.sign.HTML_TAG_END, 
                _.trim(tagContent.substr(2, tagContent.length - 3))
        ];
    }
    //tag start
    var result = [_.sign.HTML_TAG_START, '', []];
    //将最后的>和/去掉, 最多只能去一个，因为smarty的右定界符可能含有/和>
    tagContent = _.trim(tagContent.substr(0, tagContent.length - 1));
    if (tagContent[tagContent.length - 1] === '/'){
        var right_delimiter = this.rightDelimiter;
        var lastChars = tagContent.substr(tagContent.length - right_delimiter.length - 1);
        if (right_delimiter != lastChars){
            tagContent = _.trim(tagContent.substr(0, tagContent.length - 1));
        }
    }
    this.parsePos = 1;
    this.content = tagContent;
    this.contentLength = tagContent.length;
    var tagName = '';
    var str = '';
    var re = '';
    while (true){
        if (this.parsePos >= this.contentLength){
            break;
        }
        str = this.content[this.parsePos];
        this.parsePos++;
        if(!(/^[a-z0-9]{1}/).test(str)){
            this.parsePos--;
            break;
        }else{
            tagName += str;
        }
    }

    // 如果标签名解析出来为空，再进一步判断是否为Smarty变量
    if(!tagName) {
        str = this.content[this.parsePos];
        this.parsePos++;
        re = _.getTplDelimiterToken.call(this);
        if(re) {
            tagName = re[0];
        }else{
            this.parsePos--;
        }
    }	

    //get tag name
    result[1] = tagName;
    var attr = '',
        name = '';
    while (true){
        if (this.parsePos >= this.contentLength){
            break;
        }
        str = this.content[this.parsePos];
        this.parsePos++;
        re = '';
        //处理href=<&spDomain&>/sys/aa, 值左右没有引号但含有smarty变量的情况
        if (!name){
            re = _.getTplDelimiterToken.call(this);
        }
        if (re){
            //处理这种情况：<&if disabled&>disabled<&/if&>
            if (attr){
                result[2].push([attr, '']);
                attr = '';
            }
            result[2].push([_.sign.HTML_TPL_ATTR_NAME, re[0]]);
        }else if (str === '"' || str === "'"){
            //处理value="<&if test=""&>1<&else&>0<&/if&>"的情况
            this.parsePos++;
            var o = _.getTplDelimiterToken.call(this);
            re = str;
            if (o){
                re += o[0];
            }else{
                this.parsePos--;
            }
            re +=  this._getUnformated(str);
            result[2].push([name, re]);
            name =  '';
            re = '';
        }else if (str === '='){
            if (attr){
                name = attr;
            }else {
                //处理key为smarty变量：<&key&>="<&value&>"
                var preItem = result[2][result[2].length - 1];
                if (preItem[0] === _.sign.HTML_TPL_ATTR_NAME){
                    name = preItem[1];
                    result[2].pop();
                }
            }
            attr = '';
        }else if (str === ' '){
            if (attr){
                if (name){
                    result[2].push([name, attr]);
                }else{
                    result[2].push([attr, '']);
                }
            }
            name = '';
            attr = '';
        }else{
            if (str !== ' ') attr += str;
        }
    }
    if (attr){
        if (name){
            result[2].push([name, attr]);
        }else{
            result[2].push([attr, '']);
        }
    }
    return result;
};

AnalyticHtml.prototype.splitAttributeValue =function (value){
    value = _.trim(value, '\"\'');
    this.parsePos = 0;
    this.content = value;
    this.contentLength = value.length;
    var result = [];
    var item = '';
    var patternstr = _.preg_quote(this.leftDelimiter, '/') 
                  + '\\s*\\(.*?)\\s*' ._.preg_quote(this.rightDelimiter, '/');
    var pattern = new RegExp(patternstr, 'i');
    while (true){
        if (this.parsePos >= this.contentLength){
            break;
        }
        var str = this.content[this.parsePos];
        this.parsePos++;
        var re = _.getTplDelimiterToken.call(this);
        if (re){
            var tpl = re[0];
            if (pattern.test(tpl)){//输出的字符
                if (item){
                    tpl = item . tpl;
                    item = '';
                }
	                            result.push([tpl, _.sign.HTML_ATTR_VALUE_MIXED]);
            }else{
                if (item){
                    result.push([item, _.sign.HTML_CONTENT]);
                    item = '';
                }
                result.push(re);
            }
            
        }else if (str == ' '){
            if (item){
                result.push([item, _.sign.HTML_CONTENT]);
                item = '';
            }
        }else{
            item += str;
        }
    }
    if (item){
        result.push([item, _.sign.HTML_CONTENT]);
    }
    return result;
};

