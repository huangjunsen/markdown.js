/**
 * markdown.js 转换工具
 * 特点：
 * 1. 兼容性强，只依赖原生 js 。
 * 2. 小巧。
 * 3. 语法大多采用 ES6 。
 * 4. markdown 语法是参考 github 的语法的，但是优化了很多我觉得很没有必要的地方。
 *
 * 关于创作：
 * markdown 已经被全球广泛使用这么多年了，我这个时候写的 markdown.js 怎么可能是原创的呢？
 * 所以我不敢说自己是原创的，但是，下面所有的代码都是我一行行自己想出来的，并未从任何地方复制粘贴过。
 * 前期有使用 markdown-js(https://github.com/evilstreak/markdown-js) 进行 markdown 转换，但是非常、非常、非常不好用。
 * 而且充斥着大量的 bug （也许不是 bug ，只是语法分支不同），尝试过修改，但是不凑效，因为 markdown 语法有太多分支了。
 * 所以写这个脚本的目的也在于不依赖于别人，自己写的，自己维护起来总会得心应手一点。
 *
 * LICENSE: MIT
 *
 * version: v0.1beta
 *
 * update:
 * 2018-04-22 v0.1beta
 * 1. 初始化版本。
 * 2. 可以使用 toHtml 方法将 markdown 文本转换为 html 。
 * 3. 版本号为 beta ，意味着尚在调试阶段，尚未可以正式使用。
 *
 * @author sam 2018-04
 */
const markdown = {
    // 匹配的正则表达式
    // 此处的 blockTypeRegExp 需要与 getBlocks 方法中的正则对应
    blockTypeRegExp: new RegExp(/(^#{1,6}\s?|^[-=]{3,}\s*$|^[\*\-]\s|^\d+\.\s|^```|^(&gt;){1,6} |^(.*?\|)+.*$)/),
    innerTypeRegExp: new RegExp(/(?=[^\\]?)(&lt;|[~=_]{2}|[\*]{1,2}|\]\(|`)/g),
    blocks: [
        // 文本块，格式：
        // {
        //  type: [String],             块区类型
        //  content: [List<String>],    有效文本块
        // }
    ],

    /** 
     * 从 markdown 字符转换为 html 字符串
     */
    toHtml: function(obj) {
        try{
            if(typeof obj === 'object' && obj instanceof jQuery){
                // 添加对 jquery 对象的支持
                obj = obj.html();
            }
        } catch (e) {
            console.log(e);
            console.log('toHtml function is only accept markdown string or jquery object as param, please check your input.')
            obj = null;
        }
        if(!obj) return;
        // 分割成块区
        this.blocks = this.__getBlocks(obj);
        let html = "";
        this.blocks.forEach((b) => {
            // 遍历块区，将块区转换为 html 文本。
            const h = this.__block2html(b.type, b.content);
            html += h;
        });
        return html;
    },
    /**
     * 从 html 字符转换为 markdown 字符串
     */
    toMarkdown: function(obj) {
        // TODO: 
        return 'This method has not been implemented.';
    },
    /**
     * 将 html 字符串分割成功块区
     * @param  html 待分割的 html 字符串
     * @return blocks 分割好的块区
     */
    __getBlocks: function(html) {
        const strList = html.split('\n');
        const blocks = [];
        for (let i = 0; i < strList.length; i++) {
            const line = strList[i];
            const match = line.match(this.blockTypeRegExp);
            if (match) {
                // 命中作为单独块区的情况
                const m = match[1];
                let block = null,
                    type = null,
                    content = null;
                switch (true) {
                    case /^#{1,6}\s?/.test(m):
                        // 标题
                        type = 'h';
                        break;
                    case /^[-=]{3,}\s*$/.test(m):
                        // 分割线
                        type = 'hr';
                        break;
                    case /^[\*\-]\s/.test(m):
                        // 无序列表，需要特殊处理
                        type = 'ul';
                        block = this.__getNormarBlock(strList.slice(i), new RegExp(/^[\*\-] /));
                        if (block && block.length>0) {
                            i += block.length;
                        }
                        content = block;
                        break;
                    case /^\d+\.\s/.test(m):
                        // 有序列表
                        type = 'ol';
                        block = this.__getNormarBlock(strList.slice(i), new RegExp(/^\d+\. /));
                        if (block && block.length>0) {
                            i += block.length;
                        }
                        content = block;
                        break;
                    case /^(&gt;){1,6} /.test(m):
                        // 缩进
                        type = 'blockquote';
                        block = this.__getNormarBlock(strList.slice(i), new RegExp(/^(&gt;){1,6} /));
                        if (block && block.length>0) {
                            i += block.length;
                        }
                        content = block;
                        break;
                    case /^```/.test(m):
                        // 代码块，需要特殊处理
                        type = 'codeBlock';
                        block = this.__getCodeBlock(strList.slice(i));
                        if (block && block.length>0) {
                            // 这里的 +1 是为了跳过 ``` 这一行
                            i += block.length+1;
                        }
                        content = block;
                        break;
                    case /^(.*\|)+.*$/.test(m):
                        // 表格
                        type = 'table';
                        block = this.__getNormarBlock(strList.slice(i), new RegExp(/^(.*?\|)+.*$/));
                        if (block && block.length>0) {
                            i += block.length;
                        }
                        content = block;
                        break;
                    default:
                        break;
                }
                if (!content) content = line;
                if (type) {
                    blocks.push({type, content});
                }else{
                    // 理论上这种情况是不存在的
                    console.log('this line is not expect, please send me a issue.', line);
                }
            }else{
                // 不能命中为特殊块区，则认为是普通段落的情况
                const type = 'p';
                const content = this.__getSectionBlock(strList.slice(i));
                if (content && content.length>0) {
                    i += content.length;
                    blocks.push({type, content});
                } else {
                    // 这个地方肯定是得到空行了
                    blocks.push({type: 'br'});
                }
            }
        };
        return blocks;
    },
    /**
     * 获取常规块区
     * @param  strList 从当前行开始，具有相似判断规则的文本列表
     * @param  regExp  规则判断表达式
     * @return block   具有相同规则的块
     */
    __getNormarBlock: function(strList, regExp) {
        const block = [];
        for (let i = 0; i < strList.length; i++) {
            let line = strList[i];
            if (/^$/.test(line)) {
                // 退出条件 1 ： 空行
                break;
            }
            if (line.match(regExp)) {
                block.push(line);
            }else{
                // 退出条件 2 ： 规则不匹配
                break;
            }
        };
        return block;
    },
    /**
     * 获取代码块
     *
     * @param strList    从 ``` 开始（含）的文本列表
     * @return codeBlock 含 ```<language> 不含结尾 ``` 的代码块
     */
    __getCodeBlock: function(strList) {
        let blockEnd = false;
        const codeBlock = [];
        for (let i = 0; i < strList.length; i++) {
            let line = strList[i];
            if (/^```[\s]*$/.test(line)){
                // 退出条件
                // 所以要求不能嵌套代码
                blockEnd = true;
                break;
            }
            codeBlock.push(line);
        };
        if (!blockEnd) {
            return null;
        }
        return codeBlock;
    },
    /** 获取段落块 */
    __getSectionBlock: function(strList) {
        const block = [];
        for (let i = 0; i < strList.length; i++) {
            let line = strList[i];
            if (/^$/.test(line)) {
                // 退出条件 1 ： 空行
                break;
            }
            if (line.match(this.blockTypeRegExp)) {
                // 退出条件 2 ： 命中了特殊块区的规则
                break;
            }
            block.push(line);
        };
        return block;
    },
    /**
     * 块转 html
     * @param  type    块类型
     * @param  content 块内容（含有包含类型的字符）
     * @return html    html文本
     */
    __block2html: function(type, content) {
        let html = null;
        let subHtml = '';
        let m = null;
        switch (type) {
            case 'br':
                html = '<br />';
                break;
            case 'p':
                subHtml = this.__getSubHtml(content);
                html = `<p>${subHtml.join('<br />')}</p>`;
                break;
            case 'h':
                m = content.match(/^(#{1,6})\s*(.*?)\s*$/);
                if (!m || !m[1]) {
                    console.log('header format error');
                    break;
                }
                const tag = `h${m[1].length}`;
                html = `<${tag}>${m[2]}</${tag}>`;
                break;
            case 'hr':
                html = '<hr />';
                break;
            case 'ul':
                const ulList = [];
                content.forEach((c) => {
                    m = c.match(/^([\*\-])\s+(.*?)\s*$/);
                    ulList.push(m[2]);
                });
                subHtml = this.__getSubHtml(ulList);
                html = `<ul><li>${subHtml.join('</li><li>')}</li></ul>`;
                break;
            case 'ol':
                const olList = [];
                let start = null;
                content.forEach((c) => {
                    m = c.match(/^(\d+\.)\s+(.*?)\s*$/);
                    if (!start) {
                        start = m[1].replace(/\./g, '');
                    }
                    olList.push(m[2]);
                });
                // 有序列表有可能指定了第一个（开始）数字
                let startStr = '';
                if (start != 1) {
                    startStr = ` start="${start}"`;
                }
                html = `<ol${startStr}><li>${olList.join('</li><li>')}</li></ol>`;
                break;
            case 'table':
                // 表格的代码有点复杂
                const thList = [],
                      trList = [],
                      alignList = [];
                let bodyFlag = false;
                // 遍历整个块区
                content.forEach((t) => {
                    m = t.match(/^(\s*:?-{2,6}:?\s*\|)+\s*:?-{2,6}:?\s*$/);
                    if (m) {
                        // 表格表头表体分割线
                        t.split('|').forEach((a) => {
                            if (/^\s*:-{2,6}\s*$/.test(a)) {
                                alignList.push('left');
                            } else if (/^\s*-{2,6}:\s*$/.test(a)) {
                                alignList.push('right');
                            } else if (/^\s*:-{2,6}:\s*$/.test(a)) {
                                alignList.push('center');
                            } else {
                                alignList.push('');
                            }
                        });
                        bodyFlag = true;
                    }else{
                        // 不是分割线的时候，判断一下是否已经经过了分割线，来录入不同的数组
                        let tag = 'th';
                        if (bodyFlag) tag = 'td';
                        const tdList = [];
                        t.split('|').forEach((td) => {
                            tdList.push(td.trim());
                        });
                        for (var i = 0; i < tdList.length; i++) {
                            tdList[i] = `<${tag} align="${alignList[i]}">${tdList[i]}</${tag}>`;
                        };
                        if (bodyFlag) {
                            trList.push(tdList.join(''));
                        } else {
                            // 由于此时尚未获得 align 属性，先保存为 td 数组
                            thList.push(tdList);
                        }
                    }
                });
                // 修正 thList 的 align 属性
                for (var i = 0; i < thList.length; i++) {
                    for (var j = 0; j < thList[i].length; j++) {
                        let obj = document.createElement("tr");
                        obj.innerHTML = thList[i][j];
                        if (alignList[j]) obj.childNodes[0].setAttribute('align', alignList[j]);
                        thList[i][j] = obj.innerHTML;
                    };
                    thList[i] = thList[i].join('');
                };
                html = '<table><thead>'
                    + `<tr>${thList.join('</tr><tr>')}</tr>`
                    + '</thead><tbody>'
                    + `<tr>${trList.join('</tr><tr>')}</tr>`
                    + '</tbody></table>';
                break;
            case 'codeBlock':
                m = content[0].match(/^```(.*?)\s*$/);
                const codeClass = m?m[1]:'';
                html = `<pre class="${codeClass}"><code>\n${content.slice(1).join('\n')}\n</code></pre>`;
                break;
            case 'blockquote':
                // 缩进，这个是个特殊的段落块区，比较复杂，需要递归
                const blockQuoteList = this.__dealBlockQuote(content);
                html = `<blockquote><p>${blockQuoteList.join('</p><p>')}</p></blockquote>`;
                break;
        }
        return html;
    },
    /**
     * 将行内的 markdown 文本数组转换为 html 文本数组
     * 含有递归的内容
     * 
     * @param  strList markdown 文本数组
     * @return htmlList html 文本数组
     */
    __getSubHtml: function(strList) {
        const htmlList = [];
        strList.forEach((line) => {
            const match = line.match(this.innerTypeRegExp);
            if (match) {
                let subMatch = null,
                    flag = 0,
                    beforeStr = '',
                    innerStr = '',
                    afterStr = '';
                if (match.indexOf('`')>=0) {
                    // 如果含有 inlineCode ，优先进行处理
                    // 因为 inlineCode 是不进行子编码的
                    for (var i = 0; i < line.length; i++) {
                        if (line[i] === '`' && (i===0 || (i>0 && line[i-1] !== '\\'))) {
                            flag++;
                            continue;
                        }
                        switch (flag) {
                            case 0: beforeStr += line[i]; break;
                            case 1: innerStr += line[i]; break;
                            case 2: afterStr += line[i]; break;
                        }
                    };
                    // 递归调用
                    let beforeHtml = beforeStr;
                    if (beforeStr.match(this.innerTypeRegExp)) {
                        beforeHtml = this.__getSubHtml([beforeStr])[0];
                    }
                    let afterHtml = afterStr;
                    if (afterStr.match(this.innerTypeRegExp)) {
                        afterHtml = this.__getSubHtml([afterStr])[0];
                    }
                    htmlList.push(`${beforeHtml}<code>${innerStr}</code>${afterHtml}`);
                } else {
                    const m = match[0];
                    let beforeHtml,afterHtml,url;
                    switch (m) {
                        case '&lt;':
                            // 处理自动 url ，这是一个特殊的逻辑
                            for (var i = 0; i < line.length; i++) {
                                if (flag < 2 && /\&lt;|\&gt;/.test(line.slice(i, i+4)) && (i===0 || (i>0 && line[i-1] !== '\\'))) {
                                    flag++;
                                    i += 3;
                                    continue;
                                }
                                switch (flag) {
                                    case 0: beforeStr += line[i]; break;
                                    case 1: innerStr += line[i]; break;
                                    case 2: afterStr += line[i]; break;
                                }
                            };
                            // 递归调用
                            beforeHtml = beforeStr;
                            if (beforeStr.match(this.innerTypeRegExp)) {
                                beforeHtml = this.__getSubHtml([beforeStr])[0];
                            }
                            afterHtml = afterStr;
                            if (afterStr.match(this.innerTypeRegExp)) {
                                afterHtml = this.__getSubHtml([afterStr])[0];
                            }
                            url = null;
                            if (/^((ftp)|(https?)|(mailto):\/\/)/.test(innerStr)) {
                                url = innerStr;
                            }
                            if (url) {
                                htmlList.push(`${beforeHtml}<a href="${url}">${innerStr}</a>${afterHtml}`)
                            } else {
                                // 如果不能命中 ftp/http(s)/mailto 这三种类型的链接，那么认为这不是一个自动 url
                                htmlList.push(`${beforeHtml}<${innerStr}>${afterHtml}`);
                            }
                            break;
                        case '](':
                            // 处理图片和链接 ，这是一个特殊的逻辑
                            let innerStr1 = '', innerStr2 = '', isImg = false;
                            for (var i = 0; i < line.length; i++) {
                                if (line[i]+line[i+1] === '![' && (i===0 || (i>0 && line[i-1] !== '\\'))) {
                                    // 图片开始
                                    flag = 1;
                                    isImg = true;
                                    i++;
                                    continue;
                                }
                                if (line[i] === '[' && (i===0 || (i>0 && /[^!\\]/.test(line[i-1])))) {
                                    // 链接开始
                                    flag = 1;
                                    continue;
                                }
                                if (line[i]+line[i+1] === '](' && (i===0 || (i>0 && line[i-1] !== '\\'))) {
                                    // 描述结束， url 开始
                                    flag = 2;
                                    i++;
                                    continue;
                                }
                                if (line[i] === ')' && (i===0 || (i>0 && /[^!\\]/.test(line[i-1])))) {
                                    // 图片/链接结束
                                    flag = 3;
                                    continue;
                                }
                                switch (flag) {
                                    case 0: beforeStr += line[i]; break;
                                    case 1: innerStr1 += line[i]; break;
                                    case 2: innerStr2 += line[i]; break;
                                    case 3: afterStr += line[i]; break;
                                }
                            };
                            // 递归调用
                            beforeHtml = beforeStr;
                            if (beforeStr.match(this.innerTypeRegExp)) {
                                beforeHtml = this.__getSubHtml([beforeStr])[0];
                            }
                            afterHtml = afterStr;
                            if (afterStr.match(this.innerTypeRegExp)) {
                                afterHtml = this.__getSubHtml([afterStr])[0];
                            }
                            url = null;
                            if (innerStr2) {
                                url = innerStr2;
                            }
                            if (url) {
                                if (isImg) {
                                    htmlList.push(`${beforeHtml}<img src="${url}" alt="${innerStr1}" />${afterHtml}`);
                                } else {
                                    htmlList.push(`${beforeHtml}<a href="${url}">${innerStr1}</a>${afterHtml}`);
                                }
                            } else {
                                // 如果不能命中 ftp/http(s)/mailto 这三种类型的链接，那么认为这不是一个自动 url
                                htmlList.push(`${beforeHtml}[${innerStr1}](${innerStr2})${afterHtml}`);
                            }
                            break;
                        case '~~':
                            htmlList.push(this.__dealInlineBlock(line, '~~', 's'));
                            break;
                        case '==':
                            htmlList.push(this.__dealInlineBlock(line, '==', 'mark'));
                            break;
                        case '**':
                            htmlList.push(this.__dealInlineBlock(line, '**', 'b'));
                            break;
                        case '__':
                            htmlList.push(this.__dealInlineBlock(line, '__', 'b'));
                            break;
                        case '*':
                            htmlList.push(this.__dealInlineBlock(line, '*', 'i'));
                            break;
                        default:
                            break;
                    }
                }
            } else {
                htmlList.push(line);
            }
        });
        return htmlList;
    },
    __dealInlineBlock: function(line, matchStr, type) {
        let flag = 0,
            beforeStr = '',
            innerStr = '',
            afterStr = '';
        for (var i = 0; i < line.length; i++) {
            if (matchStr.length === 2){
                if (line[i]+line[i+1] === matchStr && (i===0 || (i>0 && line[i-1] !== '\\'))) {
                    flag++;
                    i++;
                    continue;
                }
            } else {
                if (line[i] === matchStr && (i===0 || (i>0 && line[i-1] !== '\\'))) {
                    flag++;
                    continue;
                }
            }
            switch (flag) {
                case 0: beforeStr += line[i]; break;
                case 1: innerStr += line[i]; break;
                case 2: afterStr += line[i]; break;
            }
        };
        // 递归调用
        let beforeHtml = beforeStr;
        if (beforeStr.match(this.innerTypeRegExp)) {
            beforeHtml = this.__getSubHtml([beforeStr])[0];
        }
        let innerHtml = innerStr;
        if (innerStr.match(this.innerTypeRegExp)) {
            innerHtml = this.__getSubHtml([innerStr])[0];
        }
        let afterHtml = afterStr;
        if (afterStr.match(this.innerTypeRegExp)) {
            afterHtml = this.__getSubHtml([afterStr])[0];
        }
        return `${beforeHtml}<${type}>${innerHtml}</${type}>${afterHtml}`;
    },
    /** 处理缩进段落 */
    __dealBlockQuote: function(strList) {
        const htmlList = [];
        for (var i = 0; i < strList.length; i++) {
            const m = strList[i].match(/^(&gt;)\s*(.*?)\s*$/);
            const sm = m[2].match(/^(&gt;)\s*(.*?)\s*$/);
            if (sm) {
                // 进入递归
                const subStrList = [];
                const tmpList = strList.slice(i);
                for (var j = 0; j < tmpList.length; j++) {
                    const s = tmpList[j];
                    if (/^&gt;&gt;/.test(s)) {
                        // 至少要有两个 > 才有资格进入递归
                        // 去掉第一个 > 号
                        subStrList.push(s.substring(4));
                    } else {
                        break;
                    }
                };
                const subList = this.__dealBlockQuote(subStrList);
                htmlList.push(`<blockquote><p>${subList.join('</p><p>')}</p></blockquote>`);
                // 注意，此处跳过的行数应该是子 blockquote 行数，
                // 但是由于 for 循环自带的 i++ ，所以这里需要减 1 才对。
                i += subStrList.length-1;
            } else {
                // 递归退出条件
                const html = this.__getSubHtml([m[2]]);
                htmlList.push(html);
            }
        };
        return htmlList;
    }
};
