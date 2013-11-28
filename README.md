Mucuna（猫豆）
======
一套简单的前端编译平台

## 安装

```
npm install -g mucuna
```
## 配置项

设置为true时，是同意编译该类型

```
{
	//静态文件编译目录
	"static_path": "src",
	//合并文件名称
	"combo_file": "combo",
	// 编译后文件编码
	"file_encoding": "utf-8",
	//是否编译 css js img
	"css_combine": true,
	"js_combine": false,
	"img_combine": true
}
```

## 基本用法

1. 在项目根目录下建立配置文件
2. 在根目录运行
```
mucuna (此处为配置文件)
```
3. 编译完成提示或编译失败提示
4. 执行代码目录生成output文件夹
5. 上线时，拷贝output下文件上线

## 示例

[点击查看](https://github.com/Johnqing/mucunaExample)

## 说明

output是Mucuna编译后，文件生成目录。

后续添加的模块编译后，都会生成到output文件夹内。

## 更新日志
+ 2013/11/28 图片压缩、根据配置项来编译文件
+ 2013/11/27 js、css压缩合并
+ 2013/11/25 添加压缩静态资源文件，并且按照目录结构在output目录生成

## 待添加模块
+ 错误日志处理
+ 上线时自动拷贝并备份脚本
+ css sprite
+ html模板处理(js、css添加版本号等)