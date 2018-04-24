# markdown.js 转换工具  
---  
一个基于原生 js 的，轻量级的 markdown <-> html 转换工具。    
特点：  
1. 兼容性强，只依赖原生 js 。  
2. 小巧。  
3. 语法大多采用 ES6 。  
4. markdown 语法是参考 github 的语法的，但是优化了很多我觉得很没有必要的地方。  

## 版本  
V0.2.0  

### 功能规划  

1. 添加 toMarkdown 方法。  
2. 添加能够良好匹配的 css 样式。  
3. 提供压缩版本。  
4. 兼容主流的 markdown 语法。（此功能未必会做）  
  
## 版权  
MIT LICENSE  
  
## 依赖  
javascript  
  
## 浏览器支持  

* IE9+  
* Firefox (latest)  
* Safari (latest)  
* Chrome (latest)  
* Opera (latest)  
  
## 示例  
[demo](https://huangjunsen.github.io/markdown.js/demo/demo.html)  
  
## 使用方法  
```javascript  
const htmlStr = markdown.toHtml(markdownStr);  
```  
  
## 参数  
无  
  
## 注意事项  
暂无  
  
## 关于创作：  
markdown 已经被全球广泛使用这么多年了，我这个时候写的 markdown.js 怎么可能是原创的呢？  
所以我不敢说自己是原创的，但是，下面所有的代码都是我一行行自己想出来的，并未从任何地方复制粘贴过。  
前期有使用 markdown-js(https://github.com/evilstreak/markdown-js) 进行 markdown 转换，但是非常、非常、非常不好用。  
而且充斥着大量的 bug （也许不是 bug ，只是语法分支不同），尝试过修改，但是不凑效，因为 markdown 语法有太多分支了。  
所以写这个脚本的目的也在于不依赖于别人，自己写的，自己维护起来总会得心应手一点。  

## 更新记录  
2018-04-22 v0.1beta  
> 1. 初始化版本。  
> 2. 可以使用 toHtml 方法将 markdown 文本转换为 html 。  
> 3. 版本号为 beta ，意味着尚在调试阶段，尚未可以正式使用。  

2018-04-24 v0.2.0  
> 1. 使用 eslint 进行代码校验。  
> 2. 修复嵌套或者同一行出现相同 markdown 语法导致后面的部分不能被正常识别的问题。  
> 3. 为表格内行添加 markdown 解析。  
> 4. 修正一些不不要的行为。  
> 5. 版本号去除 beta ，可以正式应用。  
