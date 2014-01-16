/*
 * author: john
 * build.js  - 构建工具主体
 * description:
 * 所有的实际构建操作均在此文件中实现。
 */
var fs = require('fs'),
path = require('path'),
cp = require('child_process'),
cleancss = require('clean-css'),
uglifyjs = require('uglify-js'),
debug = require('./lib/debug').logger;
/**
 * 加密
 * @type {*}
 */
var crypto = require('crypto');
function md5 (text) {
    return crypto.createHash('md5').update(text).digest('hex');
};
/**
 * href|src地址替换
 * @param tplHtml
 * @returns {XML|string|void}
 */
function fileVersion(tplHtml, file, config, regx){
    var binPath = config.binPath,
        rPath = binPath.replace(/\//, '\\');
    regx = regx || /(?:src|href)=['\"]?([^\'\"]*)['\"]?/igm;
    var newStr = tplHtml.replace(regx, function(m, p){
        var _file = path.dirname(file).split(process.cwd());
        var root = _file[1].replace(/\\/g, '/').substring(1);
        var fileTruePath = realpath(root+'/'+p);
        fileTruePath = path.resolve(_file[0], fileTruePath);
        try{
            var stFile = fs.readFileSync(fileTruePath, 'utf8');
            // 对文件内容进行md5
            var version = md5(stFile);
            version = version.substring(version.length-6);
            var newURL = p.replace(/\?v=\w+/, '')+'?v='+version;
            return m.replace(p, newURL);
        } catch (err){
            if(config.tpl){
                debug(file+'文件中'+p+' 更新版本号失败，请确认是否存在!', 2);
            }else{
                debug(fileTruePath+' is not found!', 1);
            }
            return m;
        }

    });
    return newStr;
}

function jsParse(rawCode){
    try{
        var jsp = uglifyjs.parse,
            pro = uglifyjs.uglify,
        // 解析成语法树
            ast = jsp(rawCode);
        ast.figure_out_scope();
        var compressor = uglifyjs.Compressor({
            // 逗号操作符隔开
            sequences     : true,
            //属性优化 a[b] => a.b
            properties    : true,
            // 删掉没用的代码
            dead_code     : true,
            //干掉 debugger
            drop_debugger : true,
            // 不安全因素优化
            unsafe        : true,
            // 条件语句优化 转为三目
            conditionals  : true,
            // 常量优化
            evaluate      : false,
            unused        : false,
            hoist_funs    : false,
            hoist_vars    : false,
            if_return     : false,
            join_vars     : false,
            cascade       : false,
            side_effects  : false,
            global_defs   : {}
        });
        ast = ast.transform(compressor);
        ast.mangle_names();
        return ast.print_to_string();
    } catch (err){
        debug('使用 uglify-js压缩时发生错误： ' + err, 2);
        return;
    }
}
function cssParse(rawCode, opts){
    try{
        var regx = /url\s*\(*['\"]?([^\'\"]*)['\"]?\s*\)/igm
        var code = new cleancss().minify(rawCode);
        return fileVersion(code, opts.binPath, opts.config, regx);
    } catch (err){
        debug('使用 clean-css 压缩css时发生错误： ' + err, 2);
        return
    }
}
/**
 * 相对路径修改
 * @param path
 * @returns {XML}
 */
var DOT_RE = /\/\.\//g
var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
var DOUBLE_SLASH_RE = /([^:/])\/\//g

function realpath(path) {
    // /a/b/./c/./d ==> /a/b/c/d
    path = path.replace(DOT_RE, "/")

    // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
    while (path.match(DOUBLE_DOT_RE)) {
        path = path.replace(DOUBLE_DOT_RE, "/")
    }
    // a//b/c  ==>  a/b/c
    path = path.replace(DOUBLE_SLASH_RE, "$1/")

    return path
}
//拼接数组B到数组A后
function _concat(arrayA, arrayB){
    if(arrayB == null){
        arrayB = arrayA;
        arrayA = this;
    }
    while(arrayB.length>0){
        arrayA.push(arrayB.shift());
    }
    return arrayA;
}

function toObj (arr){
    var o ={};
    for (var i=0, j=arr.length; i<j; ++i) {
        o[arr[i]] = true;
    }
    return o;
}
function keys(o){
    var rst=[];
    for(i in o){
        if(Object.prototype.hasOwnProperty.call(o,i)){
            rst.push(i);
        }
    }
    return rst;
}
//数组去重
function uniqArray(arr){
    return keys(toObj(arr));
}

//trim string
function trim(str){
    return str.replace(/(^\s*)|(\s*$)/g, '');
}

//写文件前先确定目录是否存在，不存在的话就建立
function ensureDirectory(dir) {
    if ( dir !== '.' && dir.length <= 1 ) {
        return;
    }
    if (dir[0] != '/') {
        dir = path.resolve('.', dir);
    }

    if(dir.indexOf('output') >= -1){
       dir = dir.substring(dir.indexOf('output'), dir.length);
    }

    var dirs = dir.replace(/\\/g, '/').split('/'), i, l, _dir;

    for ( i = 1, l = dirs.length; i <= l; i++ ) {
        _dir = './'+dirs.slice(0, i).join('/');

        if (!fs.existsSync(_dir)) {
            fs.mkdirSync(_dir, '775');
        }
    }
}

/* 功能: 格式化date
 * @param {date} date
 * @returns {string} formatedDate
 * description:
 * 返回类似2011/12/2 8:0:12
 */
function formatDate(date){
    return [date.getFullYear(),'/',date.getMonth()+1,'/',date.getDate(),
        ' ',date.getHours(),':',date.getMinutes(),':',date.getSeconds()].join('');
}
/**
 * 递归目录下的所有文件
 * @param rpath
 * @param callback
 */
function walk(rpath, callback){
    var dirList = fs.readdirSync(rpath);

    dirList.forEach(function(item){
        if(fs.statSync(rpath + '/' + item).isFile()){
            var filePath = path.resolve(rpath, item);
            callback && callback(filePath);
        }
    });

    dirList.forEach(function(item){
        if(fs.statSync(rpath + '/' + item).isDirectory()){
            walk(rpath + '/' + item, callback);
        }
    });
}

/**
 * 合并文件
 * @param filepaths
 * @param srcDir
 */
function importFile(filepaths, cbDir){
    //所有已经被合并的文件
    var imported = [],
        //存放所有已经合并的文件内容
        fileCache = {},
        //存放文件的原始内容
        originalFileContent = {};

    var i, curFile;

    var comboArr = [];

    function _importAFile(file){

        function _importFileRecursively(_file, type){
            var regx = type ? /\s*document\.write.*srcPath[^'\"]+['\"]([^'\"]*\.js)['\"].*/ig :
                /@import\s+url\((?:[\'\"]?)([\w\/_\.\:\-]+\.css)(?:[\'\"]?)\)\s*[;]/ig;

            if(!fs.existsSync(_file)){
                throw 'Error: Importing file which does not exist: '+_file;
            }

            if(originalFileContent[_file]==null){
                originalFileContent[_file] = fs.readFileSync(_file,'utf8');
            }
            if(_file.indexOf(cbDir) == -1){
                return  originalFileContent[_file];
            }else{
                originalFileContent[_file] = originalFileContent[_file].replace(/\s*\(*function\s*\(\)\s{\s*.var\s+srcPath\s*\=\s*(\'|\").*(\'|\");/ig,'')
                    .replace(/\s*\}.*/ig, '');
            }


            // combo文件合并
            var comboStr =  originalFileContent[_file].replace(regx, function(matched, pl){

                var _filePath = path.dirname(_file),
                    _lastIndex = _filePath.lastIndexOf("\\");
                _filePath = _filePath.substring(0, _lastIndex);

                if(pl.indexOf('../') > -1){
                    var _indexOf = pl.indexOf('/');
                    pl = pl.substring(_indexOf + 1, pl.length);
                }
                var importingFile = path.resolve(_filePath, pl);

                importingFile = importingFile.replace(/\\/g, '\\\\');

                var fCon = originalFileContent[importingFile]==null ?
                    originalFileContent[importingFile] = fs.readFileSync(importingFile,'utf8') : originalFileContent[importingFile];

                return fCon;
            });

            return comboStr
        }

        var fileContent = path.extname(file).toLowerCase() === '.js' ?
            _importFileRecursively(file, 'js') : _importFileRecursively(file);
        imported.push(file);
        fileCache[file] = fileContent;
    }


    // 筛选数组内文件
    for(i=-1; curFile = filepaths[++i];){
        _importAFile(curFile);
    }
    return [imported, fileCache];
}
// 汉字转为Unicode字符码表示
function toUnicode(s){
    return s.replace(/([\u4E00-\u9FA5]|[\uFE30-\uFFA0])/g,function(){
        return "\\u" + RegExp["$1"].charCodeAt(0).toString(16);
    });
}
// 文件写入
function writeFile(file, callback) {
    fs.open(file, "w", "0644", function(e, fd) {
        if(e) throw e;
        callback && callback();
    });
};
/**
 * 压缩
 * @param fileList
 * @param cache
 */
function compressFile(fileList, cache, config, cp){
    var filesCount = fileList.length,
        curCount = 0,//编译文件数
        fileCompressedCache = {},//编译内容缓存
        fileSucceeded = [],
        fileFailed = [];
    function _compressRawCode(binPath, rawCode, callback){
        var extname = path.extname(binPath),
            type =  extname.substr(1);
        if(rawCode == ''){
            debug(binPath+'不存在!', 1);
            callback && callback(fileSucceeded, fileFailed);
            return
        }
        //以字符串输入源代码 rawCode，编译后保存到 fileCompressedCache[binPath].
        if(type == 'js'){
            code = jsParse(rawCode);
        }else if(type == 'css'){
            code = cssParse(rawCode, {
                binPath: binPath,
                config: config
            });
        }
        fileCompressedCache[binPath] = code
        callback(null, binPath);
    }


    var srcDir = path.resolve(config.base, config.srcPath) + '/',
        binDir = path.resolve(config.base, config.binPath) + '/',
        fileBinPath

    var i,file;
    for(i=-1;file = fileList[++i];){
        fileBinPath = path.resolve(binDir,path.relative(srcDir, file));
        // 不存在就创建
        ensureDirectory(path.dirname(fileBinPath));
        if(!Object.prototype.hasOwnProperty.call(cache, file)){
            debug(file + '不在缓存中 ', 2);
            continue;
        }
        _compressRawCode(fileBinPath, cache[file], function(error, fileCompressed){
            if(error){
                debug('无法压缩： '+ fileCompressed +'.\n\t'+error, 3);
                fileFailed.push(fileCompressed);
            } else {
                //成功构建
                var _defFileCont =  fileCompressedCache[fileCompressed]

                // 对unicode字符进行特殊处理
                _defFileCont = toUnicode(_defFileCont);
                var _fileContent = _defFileCont;   //这里将输出文件里的\n全部删掉。如果出现构建后的js不能运行的bug，查一下这里。

                delete fileCompressedCache[fileCompressed];   //清除文件缓存内容，回收内存

                // 输出
                writeFile(fileCompressed, function(){
                    fs.writeFileSync(fileCompressed, _fileContent, 'utf8');
                });
                debug('压缩完成: '+fileCompressed);
                fileSucceeded.push(fileCompressed);
            }
            if(++curCount === filesCount){
                // 所有文件编译完成
               cp && cp(fileSucceeded, fileFailed);
            }
        });



    }
}
/*
 * 复制文件
 * @param {String} from 文件源
 * @param {String} to 目标文件
 * @param {Function} callback 回调
 */
function _copyFile(from, to, callback) {
    var input, output;
    input = fs.createReadStream(from);
    output = fs.createWriteStream(to);
    input.on("data", function(d) {
        return output.write(d);
    });
    input.on("error", function(error) {
        callback && callback(error);
    });
    input.on("end", function() {
        output.end();
        callback && callback(null);
    });
};
/**
 * 文件拷贝
 * @param files
 * @param config
 * @param callback
 */
function copyFile(files, config, callback){
    callback = callback || function(){}
    var srcDir = path.resolve(config.base, config.srcPath) + '/',
        binDir = path.resolve(config.base, config.binPath) + '/',
        fileSucceeded = [],
        fileFailed = [],
        fileCount = 0,
        i;

    /**
     * 单个文件copy
     * @param file
     * @private
     */
    function _copy(file){
        file = file.replace(path.resolve(config.srcPath)+'\\', '')
        var _srcDir = path.resolve(srcDir, file),
            defFile = path.resolve(binDir, file),
            targetDir = path.dirname(defFile)+'/';
        ensureDirectory(targetDir);

        _copyFile(_srcDir, defFile, function(err){
            if(err){
                debug( '拷贝文件出错: ' +  err, 2);
                fileFailed.push(defFile);
                if(++fileCount === files.length){
                    callback(fileSucceeded,fileFailed);
                }
                return;
            }
            debug('从 '+_srcDir+' 拷贝到 '+targetDir+'完成');
            fileSucceeded.push(defFile);
            if(++fileCount === files.length){
                callback(fileSucceeded, fileFailed);
            }
        });

    }
    for(i=0; i<files.length; i++){
        _copy(files[i]);
    }
    if(files.length === 0){
        callback([],[]);
    }
}

/**
 * 版本号更新
 * @param filepaths
 * @param config
 */
function updateVersion(filepaths, config, callback){
    config.tpl = true;
    var tmpDirName = config.template;
    var tpmFile = [];
    for(var i=0;i< filepaths.length; i++){
        var tpmDir = path.resolve(path.dirname(filepaths[i]));
        if(tpmDir.indexOf(tmpDirName) >= 0){
            tpmFile.push(filepaths[i]);
        }
    }
    /**
     * 内容更新
     * @param file
     * @private
     */
    function _replaceHtml(file){
        var tplHtml = fs.readFileSync(file, 'utf8');
        var code = fileVersion(tplHtml, file, config);
        if(code){
            fs.writeFileSync(file, code, 'utf8');
            debug('已经更新版本的文件： '+file);
        }
    }
    copyFile(tpmFile, config, function(suc, fail){
        for(var i=0;i<suc.length;i++){
            _replaceHtml(suc[i]);
        }
        callback && callback();
    })

}
//===================================================================
exports.build = function(filepaths, config, callback){
    config.base = filepaths;
    config.binPath += '/'+config.srcPath;
    var srcDir = path.resolve(filepaths, config.srcPath);

    if(!fs.existsSync(srcDir)){
        debug('错误:源代码目录不存在.', 2);
        callback && callback('错误:源代码目录不存在.');
        return ;
    }
    var filepaths = [];
    walk(srcDir, function(rPath){
        filepaths.push(rPath);
    });
    var allPaths = filepaths;
    //filter all picture files
    var pictureFilepaths = filepaths.filter(function(a){
        return /\.(?:jpg|jpeg|gif|png|ico)/.test(a);
    });
    var fileCount = filepaths.length;
    // filter all js and css files
    filepaths = filepaths.filter(function(a){
        return /\.(?:js|css)/.test(a);
    });

    var importedResult;
    try{
        importedResult  = importFile(filepaths, config.combo_file);
    }catch (e){
        debug('合并文件时发生错误：'+e , 2);
        return;
    }
    debug('开始构建！');
    copyFile(pictureFilepaths, config, function(){
        // 文件压缩
        compressFile(importedResult[0], importedResult[1], config);
        //打版本号
        updateVersion(allPaths, config, function(){
            debug('结束构建！');
        });

    });

}