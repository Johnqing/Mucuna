Mucuna（猫豆）
======
一套简单的前端编译平台

## 安装

```
npm install -g mucuna
```

```
{
    //编译资源路径
    "srcPath": "src",
    //编译完成后生成路径
    "binPath": "output",
    //合并文件夹名字
    "combo_file": "combo",
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
+ js、css压缩
+ 图片资源copy到output
+ 文件版本号自动更新(通过文件md5)