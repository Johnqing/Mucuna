'use strict';

var util = module.exports = {};

util.sign = {
    FL_EOF 						: 1,   //结束
    FL_TPL_DELIMITER 			: 2,   //模板语法
	FL_NEW_LINE 				: 3,   //new line
	FL_NORMAL 					: 4,   //normal,一般很少出现这个
	
	HTML_CONTENT 				: 111, //文本
	HTML_TAG 					: 112, //一般标签
	HTML_JS_START 				: 113, //js start
	HTML_JS_CONTENT 			: 114, //js content,要手工调用js analytic
	HTML_JS_END 				: 115, //js end
    HTML_CSS_START 			: 116, //css start
	HTML_CSS_CONTENT 			: 117, //css content,要手工调用css analytic
	HTML_CSS_END 				: 118, //css end
	HTML_IE_HACK_START 		: 119, //ie hack start
	HTML_IE_HACK_EDN 			: 120, //ie hack end
	HTML_DOC_TYPE 				: 121, //doc type
	HTML_COMMENT 				: 122, //html comment
	HTML_PRE_TAG 				: 123, //pre tag
	HTML_STATUS_OK			: 124, //status ok
	HTML_TEXTAREA_TAG			: 125, //textarea tag
	HTML_TAG_START				: 126, //tag start
	HTML_TAG_END					: 127, //tag end
	HTML_TPL_ATTR_NAME			: 128, //tpl attributes name
	HTML_XML						: 129, //is xml
	HTML_ATTR_VALUE_MIXED			: 130, //class:"li-bind-<&name&>", mixed
	
	JS_START_EXPR 				    : 211, //start expression
	JS_END_EXPR 					: 212, //end expression
	JS_START_BLOCK 				: 213, //start block
	JS_END_BLOCK 					: 214, //end block
	JS_SEMICOLON 					: 215, //分号
	JS_WORD						: 216, //单词
	JS_OPERATOR					: 217, //操作符
	JS_EQUALS						: 218, //等号
	JS_INLINE_COMMENT				: 219, //行内注释
	JS_BLOCK_COMMENT				: 220, //跨级注释
	JS_COMMENT					    : 221, //注释
	JS_STRING						: 222, //字符串	
	JS_IE_CC						: 223, //条件编译	
	JS_REGEXP						: 224, //正则
	JS_WHITESPACE                 : 225, //空白（\s+）
	JS_NUMBER                      : 226, //数字
	JS_IDENTIFIER                 : 227, //标识符
	JS_PUNCTUATION                : 228, //标点或符号
	JS_KEYWORDS                    : 229, //关键字
	JS_KEYWORDS_ATOM              : 230, //原子词：true、false、null、undefined
	JS_RESERVED_WORDS             : 231, //保留字
	
	JS_MODE_EXPRESSION			: 250, //
	JS_MODE_INDENT_EXPRESSION	: 251, //
	JS_MODE_DO_BLOCK				: 252, //
	JS_MODE_BLOCK					: 253, //
	JS_MODE_ARRAY					: 254,
	

	CSS_AT						    : 311, //@
	CSS_NORMAL					    : 312, //
	CSS_DEVICE_DESC				: 313, //设备描述内容
	CSS_DEVICE_START				: 314, //设备开始符,为{
	CSS_DEVICE_END				: 315, //设备结束符，为}
	CSS_SELECTOER					: 316, //选择器
	CSS_SELECTOER_START			: 317, //选择器开始符，为{
	CSS_SELECTOER_END				: 318, //选择器结束符，为}
	CSS_COMMENT					: 319, //注释
	CSS_PROPERTY					: 320, //属性
	CSS_VALUE						: 321, //值
	CSS_COLON						: 322, //冒号
	CSS_SEMICOLON					: 323, //分号
	CSS_WHITESPACE				: 324, //空白（\s+）
    
	MSG_DEBUG                     : 401, //debug信息
	MSG_INFO                      : 402, //普通信息
	MSG_WARN                      : 403, //警告信息
	MSG_ERROR                     : 404, //错误信息
	MSG_FATAL                     : 405, //灾难性错误信息
    
	SMARTY_TAG_START              : 501, //Smarty开始标签
    SMARTY_TAG_END                : 502, //Smarty结束标签
    SMARTY_TPL_VAR                : 503, //Smarty模板变量
    SMARTY_FUNCTION_DEFINE        : 504, //Smarty function定义
    SMARTY_FUNCTION_CALL          : 505 //Smarty function调用
};

util.getTplDelimiterToken = function (){
    var left_delimiter = this.leftDelimiter;
    var right_delimiter = this.rightDelimiter;
    var leftDelimiterLen = this.leftDelimiter.length;
	var rightDelimiterLen = this.rightDelimiter.length;
	var escape = false;
    var resultString = '';
    if (this.content.substr((this.parsePos - 1), leftDelimiterLen) === left_delimiter){
        resultString += left_delimiter;
        this.parsePos += leftDelimiterLen - 1;
        var delimiterNum = 1;
        while (true){
            if (!escape){
                escape = (this.content[this.parsePos] === "\\");
            }else {
                escape = false;
            }
            if (!escape && this.content.substr(this.parsePos, rightDelimiterLen) === right_delimiter){
                resultString += right_delimiter;
                this.parsePos += rightDelimiterLen;
                if (delimiterNum === 1){
                    break;
                }else{
                    delimiterNum -= 1;
                }
            }else{
                if (this.content.substr(this.parsePos, leftDelimiterLen) === left_delimiter){
                    resultString += left_delimiter;
                    this.parsePos += leftDelimiterLen;
                    delimiterNum += 1;
                }else {
                    resultString += this.content[this.parsePos];
                    this.parsePos++;
                }
            }
            if (this.parsePos >= this.contentLength){
                break;
            }
        }
        return [resultString, util.sign.FL_TPL_DELIMITER];
    }
};

util.str_replace = function(search, replace, subject, count) {
    var i = 0,
    j = 0,
    temp = '',
    repl = '',
    sl = 0,
    fl = 0,
    f = [].concat(search),
    r = [].concat(replace),
    s = subject,
    ra = Object.prototype.toString.call(r) === '[object Array]',
    sa = Object.prototype.toString.call(s) === '[object Array]';
    s = [].concat(s);
    if (count) {
        this.window[count] = 0;
    }
    
    for (i = 0, sl = s.length; i < sl; i++) {
        if (s[i] === '') {
          continue;
        }
        for (j = 0, fl = f.length; j < fl; j++) {
            temp = s[i] + '';
            repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
            s[i] = (temp).split(f[j]).join(repl);
            if (count && s[i] !== temp) {
                this.window[count] += (temp.length - s[i].length) / f[j].length;
            }
        }
    }
    return sa ? s : s[0];
};

util.empty = function(mixed_var) {
    var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, "", "0"];
    
    for (i = 0, len = emptyValues.length; i < len; i++) {
        if (mixed_var === emptyValues[i]) {
          return true;
        }
    }
    
    if (typeof mixed_var === "object") {
        for (key in mixed_var) {
            // TODO: should we check for own properties only?
            //if (mixed_var.hasOwnProperty(key)) {
            return false;
            //}
        }
        return true;
    }
    
    return false;
};

util.trim =function (str, charlist) {
    var whitespace, l = 0,
        i = 0;
        str += '';
    
    if (!charlist) {
        // default list
        whitespace = " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
    } else {
        // preg_quote custom list
        charlist += '';
        whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    }

    l = str.length;
    for (i = 0; i < l; i++) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
          str = str.substring(i);
          break;
        }
    }

    l = str.length;
    for (i = l - 1; i >= 0; i--) {
        if (whitespace.indexOf(str.charAt(i)) === -1) {
            str = str.substring(0, i + 1);
            break;
        }
    }

    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
};

util.preg_quote = function(str, delimiter) {
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
};

util.in_array = function(needle, haystack, argStrict) {
    var key = '',
    strict = !! argStrict;
    
    if (strict) {
        for (key in haystack) {
            if (haystack[key] === needle) {
            return true;
            }
        }
    } else {
        for (key in haystack) {
            if (haystack[key] == needle) {
            return true;
            }
        }
    }
    return false;
};

util.array_key_exists = function  (key, search) {
    if (!search || (search.constructor !== Array && search.constructor !== Object)) {
        return false;
    }
    return key in search;
};

util.str_replace = function(search, replace, subject, count) {
    var i = 0,
    j = 0,
    temp = '',
    repl = '',
    sl = 0,
    fl = 0,
    f = [].concat(search),
    r = [].concat(replace),
    s = subject,
    ra = Object.prototype.toString.call(r) === '[object Array]',
    sa = Object.prototype.toString.call(s) === '[object Array]';
    s = [].concat(s);
    if (count) {
        this.window[count] = 0;
    }
    
    for (i = 0, sl = s.length; i < sl; i++) {
        if (s[i] === '') {
            continue;
        }
        for (j = 0, fl = f.length; j < fl; j++) {
            temp = s[i] + '';
            repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
            s[i] = (temp).split(f[j]).join(repl);
            if (count && s[i] !== temp) {
                this.window[count] += (temp.length - s[i].length) / f[j].length;
            }
        }
    }
    return sa ? s : s[0];
};

util.is_array = function (mixed_var) {
    var ini,
        _getFuncName = function (fn) {
            var name = (/\W*function\s+([\w\$]+)\s*\(/).exec(fn);
            if (!name) {
                return '(Anonymous)';
            }
            return name[1];
        },
        _isArray = function (mixed_var) {
            if (!mixed_var || typeof mixed_var !== 'object' || typeof mixed_var.length !== 'number') {
                return false;
            }
            var len = mixed_var.length;
            mixed_var[mixed_var.length] = 'bogus';
            if (len !== mixed_var.length) {
                mixed_var.length -= 1;
                return true;
            }
            delete mixed_var[mixed_var.length];
            return false;
        };

    if (!mixed_var || typeof mixed_var !== 'object') {
        return false;
    }

    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};

    ini = this.php_js.ini['phpjs.objectsAsArrays'];

    return _isArray(mixed_var) ||
        ((!ini || ( // if it's not set to 0 and it's not 'off', check for objects as arrays
            (parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value.toLowerCase() !== 'off')))
            ) && (
            Object.prototype.toString.call(mixed_var) === '[object Object]' && _getFuncName(mixed_var.constructor) === 'Object' // Most likely a literal and intended as assoc. array
            ));
}

util.array_merge = function() {
    var args = Array.prototype.slice.call(arguments),
        argl = args.length,
        arg,
        retObj = {},
        k = '',
        argil = 0,
        j = 0,
        i = 0,
        ct = 0,
        toStr = Object.prototype.toString,
        retArr = true;

    for (i = 0; i < argl; i++) {
        if (toStr.call(args[i]) !== '[object Array]') {
            retArr = false;
            break;
        }
    }

    if (retArr) {
        retArr = [];
        for (i = 0; i < argl; i++) {
            retArr = retArr.concat(args[i]);
        }
        return retArr;
    }

    for (i = 0, ct = 0; i < argl; i++) {
        arg = args[i];
        if (toStr.call(arg) === '[object Array]') {
            for (j = 0, argil = arg.length; j < argil; j++) {
                retObj[ct++] = arg[j];
            }
        }
        else {
            for (k in arg) {
                if (arg.hasOwnProperty(k)) {
                    if (parseInt(k, 10) + '' === k) {
                        retObj[ct++] = arg[k];
                    }
                    else {
                        retObj[k] = arg[k];
                    }
                }
            }
        }
    }
    return retObj;
}

util.rtrim = function(str, charlist) {
    charlist = !charlist ? ' \\s\u00A0' : (charlist + '').replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\\$1');
    var re = new RegExp('[' + charlist + ']+$', 'g');
    return (str + '').replace(re, '');
}

util.strlen = function(string) {
    var str = string + '';
    var i = 0,
        chr = '',
        lgth = 0;

    if (!this.php_js || !this.php_js.ini || !this.php_js.ini['unicode.semantics'] || this.php_js.ini['unicode.semantics'].local_value.toLowerCase() !== 'on') {
        return string.length;
    }

    var getWholeChar = function (str, i) {
        var code = str.charCodeAt(i);
        var next = '',
            prev = '';
        if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
            if (str.length <= (i + 1)) {
                throw 'High surrogate without following low surrogate';
            }
            next = str.charCodeAt(i + 1);
            if (0xDC00 > next || next > 0xDFFF) {
                throw 'High surrogate without following low surrogate';
            }
            return str.charAt(i) + str.charAt(i + 1);
        } else if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
            if (i === 0) {
                throw 'Low surrogate without preceding high surrogate';
            }
            prev = str.charCodeAt(i - 1);
            if (0xD800 > prev || prev > 0xDBFF) { //(could change last hex to 0xDB7F to treat high private surrogates as single characters)
                throw 'Low surrogate without preceding high surrogate';
            }
            return false; // We can pass over low surrogates now as the second component in a pair which we have already processed
        }
        return str.charAt(i);
    };

    for (i = 0, lgth = 0; i < str.length; i++) {
        if ((chr = getWholeChar(str, i)) === false) {
            continue;
        } // Adapt this line at the top of any loop, passing in the whole string and the current iteration and returning a variable to represent the individual character; purpose is to treat the first part of a surrogate pair as the whole character and then ignore the second part
        lgth++;
    }
    return lgth;
}