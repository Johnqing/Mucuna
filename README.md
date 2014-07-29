Mucuna（猫豆）
======
一套简单的前端编译平台

## 碰到的问题
1. 使用过的编译工具，都是在开发阶段，就开始编译，造成调试起来很麻烦（多文件合并/压缩后，无法准确定位到是那个文件）。
2. 配置太复杂
3. 需要维护编译前和编译后的文件
4. 版本更新太复杂
5. 图片需要手动css sprite

## Mucuna目前已解决的问题
1. 通过 `document.write` 来输出js脚本，通过 `@import` 来输出css，在上线阶段通过，Mucuna 通过正则替换掉这些配置，来进行打包
2. 使用者只需要配置json文件即可
3. 上线阶段才需要编译，所以版本控制中只需要一份开发代码即可
4. Mucuna会通过文件内容的md5来，更新每一个文件的版本号
5. Mucuna会检查语法，来提示你，不合理的语法错误
6. Mucuna会对smarty模板、html、js、css进行压缩，来减少带宽的浪费
7. 你也可以帮Mucuna增加拓展，来提示你的开发效率
8. 自动帮助你合并图片（以combo内的每一个样式表，都会生成一个相应的图片），并且替换combo后的css


## 提示
+ 使用本系统必须安装nodejs
+ 需要combo的文件，必须通过 `document.write` 或者 `@import` 来引用

## 安装

```
npm install -g mucuna
```

## 配置项

在根目录下运行

```
mucuna -a
```

会自动生成 `config.json` ，可以通过配置，其中的项来执行不同的功能

你也可以手动创建该文件，如下：

> 注意：json文件中请不要包含注释

在根目录下添加json文件，内容如下：
```
{
	// 项目文件编码
	"FILE_ENCODE": "utf-8",
	// 模板目录，针对模板进行压缩处理
	"TPL_PATH": "demo/tpl",
	// 静态资源目录
	"STATIC_PATH": "demo/src",
	// 合并文件存放文件夹
	"COMBINE_DIR": "combo",
	// 输出目录，会在根目录创建
	"BUILD_PATH": "demo/output",
	// 需要sprite图片的源路径
    "SPRITE_SOURCE_PATH": "src/img",
    // 生成sprite图片后的路径
    "SPRITE_DEST_PATH": "src/sprites/",
    // css中更新后的路径（防止实际路径和显示路径不同）
    "SPRITE_CSS_PATH": "../../sprites/",
    // HTML5语法检查
	"VALIDATE_HTML": false,
	// JS语法检查
	"VALIDATE_JS": false,
	// CSS语法检查
	"VALIDATE_CSS": false,
	// 图片优化
	"OPTIMIZE_IMG": true,
	// HTML压缩
	"COMPRESS_HTML": true,
	// JS压缩
	"COMPRESS_JS": true,
	// css压缩
	"COMPRESS_CSS": true,
	// css合并
	"COMBINE_CSS": true,
	// JS合并
	"COMBINE_JS": true,
	// 版本号更新
	"STATIC_VERSION": true
}
```

## 基本用法

1. 在项目根目录下建立配置文件
2. 在根目录运行
```
mucuna init
```
3. 编译完成提示或编译失败提示
4. 执行代码目录生成output文件夹
5. 上线时，拷贝output下文件上线

## 示例

[点击查看](https://github.com/Johnqing/mucunaExample)

## 说明

output是Mucuna编译后，文件生成目录。

后续添加的模块编译后，都会生成到output文件夹内。

## 第2版，增加功能


```
var mucuna = require('mucuna');
var endCB = function(){}
mucuna.init(process.cwd()).start(JSON.parse(config), endCB).handle([
	'checkDir',
	// findFiles 获取文件夹下，所以文件的路径和源码
	'findFiles',
	'validateHtml5',
	'validateJs',
	'validateCss',
	'htmlMin',
	'jsMin',
	'cssMin',
	'imgMin',
	'combineJS',
	'combineCss',
	'staticVersion'
]);
```

*调用顺序和执行顺序有关*

## 已支持功能
+ 针对smarty模板做压缩
+ js、css语法检查
+ css整理
+ 图片压缩(自动拷贝到output下的图片)
+ 增加日志
+ html、js、css压缩
+ 文件版本号自动更新(通过文件md5)