Mucuna（猫豆）
======
一套简单的前端编译平台

## 安装

```
npm install -g mucuna
```
> 注意：json文件中请不要包含注释

在根目录下添加json文件，内容如下：
```
{
     //编译资源路径
     "srcPath": "src",
     //编译完成后生成路径
     "binPath": "output",
     // html模板文件目录(必须在srcPath下)
     "template": "html",
     //合并文件夹名字(必须在srcPath下)
     "combo_file": "combo",
     // 项目文件编码.可选项，默认为utf8
     "fileEncoding": "utf8",
     //作者信息
     "author": "johnqing"
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

## 已支持功能
+ css整理
+ 图片压缩(自动拷贝到output下的图片)
+ 增加日志
+ js、css压缩
+ 图片资源copy到output
+ 文件版本号自动更新(通过文件md5)