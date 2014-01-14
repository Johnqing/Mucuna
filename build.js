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
appConfig;
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
               // console.log(originalFileContent[_file]);
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
            console.log('x', comboStr);
            return  comboStr
        }

        var fileContent = path.extname(file).toLowerCase() === '.js' ?
            _importFileRecursively(file, 'js') : _importFileRecursively(file);
        imported.push(file);

        fileCache[file] = fileContent;

        return [imported, fileCache];
    }


    // 筛选数组内文件
    for(i=-1; curFile = filepaths[++i];){
        _importAFile(curFile);
    }

    return [imported,fileCache];
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
            console.log(binPath + 'is empty!');
            callback && callback(fileSucceeded, fileFailed);
            return
        }
        //以字符串输入源代码 rawCode，编译后保存到 fileCompressedCache[binPath].
        if(type == 'js'){
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
                var code = ast.print_to_string()
            } catch (err){
                console.log('Error occured while compressing code using uglify-js. ' + err);
                return;
            }
        }else if(type == 'css'){
            try{
                var code = new cleancss().minify(rawCode);

            } catch (err){
                console.log('Error occured while compressing code using clean-css. ' + err);
                return
            }
        }
        fileCompressedCache[binPath] = code
        callback(null, binPath);
    }


    var srcDir = path.resolve(config.base, config.srcPath) + '/',
        binDir = path.resolve(config.base, config.binPath) + '/',
        fileBinPath

    var i,file;
    for(i=-1;file = fileList[++i];){
        fileBinPath = path.resolve(binDir,path.relative(srcDir,file));
        //console.log(fileBinPath, path.dirname(fileBinPath));
        // 不存在就创建
        ensureDirectory(path.dirname(fileBinPath));
        if(!Object.prototype.hasOwnProperty.call(cache, file)){
            console.log('Fatal error!! Trying to build file not cached: ' + file);
            continue;
        }

        _compressRawCode(fileBinPath, cache[file], function(error, fileCompressed){
            if(error){
                console.log('Error: can not compress file: '+ fileCompressed +'.\n\t'+error);
                fileFailed.push(fileCompressed);
            } else {
                //成功构建
                var _defFileCont =  fileCompressedCache[fileCompressed]

                // 对unicode字符进行特殊处理
                _defFileCont = toUnicode(_defFileCont);
                var remark = '/*author:{author},date: {date}*/\n'
                var _fileContent = remark.replace('{date}', new Date().toLocaleString())
                    .replace('{author}', config.author ) +   //增加author信息
                    _defFileCont;   //这里将输出文件里的\n全部删掉。如果出现构建后的js不能运行的bug，查一下这里。
                delete fileCompressedCache[fileCompressed];   //清除文件缓存内容，回收内存

                // 输出
                writeFile(fileCompressed, function(){
                    fs.writeFileSync(fileCompressed, _fileContent, 'utf8' );
                });
                console.log('Compress completed: '+fileCompressed, 'none');
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
        console.log(d);
        return output.write(d);
    });
    input.on("error", function(error) {
        console.log(error);
    });
    input.on("end", function() {
        output.end();
        callback && callback();
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

       // console.log('Copying '+_srcDir+' to '+ targetDir,'none');
        _copyFile(_srcDir, defFile, function(){
            fileSucceeded.push(defFile);
            if(++fileCount === files.length){
                callback(fileSucceeded,fileFailed);
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
 * 加密
 * @type {*}
 */
var crypto = require('crypto');
function md5 (text) {
    return crypto.createHash('md5').update(text).digest('hex');
};
/**
 * 版本号更新
 * @param filepaths
 * @param config
 */
function updateVersion(filepaths, config){
   // console.log(realpath('aa/bb/../cc'));
    var tmpDirName = config.template;
    var tpmFile = [];
    for(var i=0;i< filepaths.length; i++){
        var tpmDir = path.resolve(path.dirname(filepaths[i]));
        //console.log(typeof tpmDir);
        if(tpmDir.indexOf(tmpDirName) >= -1){
            tpmFile.push(filepaths[i]);
        }
    }

    copyFile(tpmFile, config, function(){

    })

}
//===================================================================
exports.build = function(filepaths, config, callback){
    config.base = filepaths;
    config.binPath += '/'+config.srcPath;
    var srcDir = path.resolve(filepaths, config.srcPath);

    if(!fs.existsSync(srcDir)){
        console.log('Source directory does not exists. Aborting build operation...');
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
        console.log('合并文件时发生错误：'. e);
        return;
    }
    // 文件压缩
    compressFile(importedResult[0], importedResult[1], config);
    copyFile(pictureFilepaths, config);
    console.log('压缩js、css，并且copy图片完成!\n开始为文件打版本号！');
    //打版本号
   // updateVersion(allPaths, config)
}