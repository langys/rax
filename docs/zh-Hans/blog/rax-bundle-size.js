---
title: Rax 系列教程：如何优雅的减少bundle size
date: 20180224
author: 正寻
---

本文试图描述在rax体系下，减少js bundle size的常规与非常规手段。阅读本文你可能会了解到一下知识点：
1\. 为什么要减少bundle size？
2\. 减少bundle size的常规手段有哪些？
3\. 如何做到模块更新与页面发布的分离？
4\. 有没有终极大招？

也许你也有新的思路，欢迎提供，同时也欢迎致力于为服务『中小业务』开发者，提升开发效率与体验，探索新技术及解决方案落地的同仁，加盟『Rax叨叨团』。

## [](#0)1\. 为什么要减少bundle size ？

Bundle这个词语频繁出现在前端视野应该是有了打包工具之后。打包工具的出现完全改变了前端的开发方式，工程化也至此迅猛发展。webpack在这个过程中几乎一骑绝尘，成为首选的打包工具。 在Rax体系下，默认会把所有资源都打到一个js bundle中，即使你写一个Hello world那么默认打出的包也有60KB(minifiy), 从淘系来讲，一般业务的平均包大小都在250KB - 300KB, 那么减少bundle size 的原因我大致归纳为以下几点：

### [](#1)1.1\. 减少网络传输大小

减少网络传输大小，不仅仅是减少网络传输时间，更重要的是节省公司的cdn带宽，你可要知道带宽支出可是占整个公司的不小的一部分，当然，作为普通开发者没有关注过这些，“大手大脚”习惯了，不当家不知柴米贵。

### [](#2)1.2\. 减少首次（屏）渲染时间，提升体验

这也是Rax开发者首要关注的点。weex下，受限当前的渲染模式：js parse ->执行->渲染，而js 引擎parse 时间与bundle size 大小是成正比的

### [](#3)1.3\. 来自程序员的自我追求

这一点就比较“玄乎”了，如何用最少的代码，写出符合业务需求的代码，难道不应该是我们的一贯追求么？

## [](#4)2\. 减少bundle size 的常规手段有哪些？

大家或多或少已经知道了很多常规的手段，比如：
1\. 手动减少重复代码，这一点推荐《clean code》这本书。也就是在自己书写代码的时候，养成良好的习惯，比如当重复的逻辑使用两次以上，就要考虑封装成函数等等。
2\. 减少一些工具函数比如lodash的使用，合理使用es6，7已经提供的方法。
3\. 避免不同版本的包重复引入，因为像webpack这种会把不同版本的包认为是不同的模块都会打进去，这一块，def流程里面是有检查的，注意修改一下就好了。
4\. 去掉rax ， 不再打进bundle，这个可以显著减少大小。
5\. js service
6\. tree shaking
7\. Code spliting
我打算重点说说，4，5, 6，7 这四点。

### [](#5)2.1 把rax 在bundle中去掉

把rax 打进bundle 是一个比较遥远的历史问题了， 那个时候，rax 还没有内置，所以就需要依靠把rax打进bundle，这在当时也没有问题， 但现在遇到的问题就是：
weex下已经内置（通过下面所说的js service），打进去真是多此一举。
web下会额外加载framework 约等于加载两份。
有明白人可能会问：如果有些手淘版本没有内置rax怎么办？这个比例已经很小了（找下统计数据TODO）,另外weex也会主动帮你降级的。所以放心使用。
def 用户只需要在`abc.json`中增加一行配置即可：

<div class="highlight">

```
  "options": {
    "externalRax": true
   }

```

</div>

通过这简单的一行，就可以减少50KB的minifiy之后的bundle size，是这些所有手段里面最立杆见影的。
非def用户，但使用的是webpack的话可以使用 externals 字段来排除。
适用客户端：手淘，天猫。
推荐指数：****
困难程度：*

### [](#6)2.2 js service

JS service 和 Weex 实例在 JS runtime 中并行运行。Weex 实例的生命周期可调用 JS service 生命周期。目前提供创建、刷新、销毁生命周期。
大促通过js service 实现的内置方案，显著减少了200KB左右的大小。

推荐指数：***  
困难程度：***

### [](#7)2.3 tree shaking

Tree shaking 应该是rollup这个打包工具的作者提出的，用于剔除『没有用到』的『模块导出』。也就是说它的应用是模块级别的。而能使用Tree shaking 的一个重要基础就是模块都是ES6 Modules, 因为ES6 Modules 有如下的特点：

*   只能作为模块顶层的语句出现，不能出现在 function 里面或是 if 里面。
*   import 的模块名只能是字符串常量，不能更改。
*   在模块初始化的时候所有的 import 都必须已经导入完成。 更多的原理，可以自行搜索。 这项技术在webpack 2上已经支持了， 但是，但是，我们的builder还是1.x，也许这里面有很多历史原因我们的webpack与社区的webpack产生了脱节，那就给我们的坡哥一点时间，慢慢升级@上坡。 相关链接：
*   Tree-shaking versus dead code elimination
*   如何评价 Webpack 2 新引入的 Tree-shaking 代码优化技术？
*   Tree shaking in webpack

推荐指数：***  
困难程度：****

### [](#8)2.4 code splitting

代码分割，按需加载，也是一套很成熟的技术了。 本质是webpack在打包的时候异步（webpackJSONP）加载，但weex下默认使用不了code splitting：
不管是jsonp也好，require.js, kissy, sea.js 也好本质都是在『运行时』动态创建script来『加载』和『执行』js的。
weex 下没有script标签，要使用就需要hack。
实现这个的技术关键是：

*   下载： 其实就是发起http请求了，可以用fetch，ajax
*   执行： new Function or eval, (weex据说准备在native层支持执行代码了) 基于以上两点，坡哥这边实现了webpack-weex-require-ensure-plugin 。 下面举一个线上在跑的例子：

<div class="highlight">

```
    const mkSdk = require('bundle-loader?name=[folder]/[name]!@ali/mk-sdk');
    mkSdk && mkSdk(Sdk => {
      this.sdk = new Sdk({pageId: 0, delay: 0});
      this.sdk.on('poplayer', data => {
        !this.state.poplayer.rule && this.setState({poplayer: data});
      }).on('optional-poplayer', data => {
        const activityId = this.parse('aid');
        const pageId = this.parse('pid');
        if ((pageId == '0' || pageId == 0) && activityId == data.id) {
          !this.state.poplayer.rule && this.setState({poplayer: data});
        }
      }).on('market-card', data => {
        this.setState({marketCard: data});
      });
    });

```

</div>

上面是使用bundle-loader 的形式，我们也可以直接使用require.ensure，类似下面：

<div class="highlight">

```
      require.ensure([], (require) => {
        pay = require('@ali/universal-pay');
      });

```

</div>

其实webpack 2 还有个System.import 更强大一些，but，我们还是1.x. 不过已经够用了。
这个问题的缺点或者说解决不了下面说的模块与页面主bundle的发布分离的问题（因为这些还是需要和主bundle一起build，虽然不build一起了）。

推荐指数：****   
困难程度：**

## [](#9)3\. 如何做到模块的更新与页面发布的分离？

假设有以下几种场景：

*   不定期的运营投放，只在某些时间才会用到某些模块，那需要打进bundle 吗？
*   动态模块场景：第三方业务提供的模块的发布与更新
*   页面是native的，内嵌的weex模块
*   可怜的zcache到达率，发布一次回到解放前。 其实在众多的搭建体系里面已经有类似的技术了，那就是编写模块，提取依赖，并把各个依赖发布到cdn，然后把各个模块combo后加载并执行。 下面这个图是我们充值中心首页用到的技术，实现了上面我说的模块的发布与页面的发布分离，当然，额外的可能需要有个配置的地方。 [![容器化.png](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/8e492fc87f2bc8ef761689b215d4a392.png "容器化.png")](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/8e492fc87f2bc8ef761689b215d4a392.png) 关键技术点：
*   相关模块包括依赖的模块需要都是rax 体系的模块
*   解析依赖（deps.json）并去除重复依赖
*   combo cdn url
*   下载
*   执行

### [](#10)3.1 开发rax模块

这个没什么好说的， def init 的时候选择rax 模块即可。

### [](#11)3.2 解析依赖并combo url

这一块我写了一个工具可以完成上述功能。
[![Snip20180223_1.png](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/e91d100f2088eaae6f9f16e42eafa4d1.png "Snip20180223_1.png")](http://ata2-img.cn-hangzhou.img-pub.aliyun-inc.com/e91d100f2088eaae6f9f16e42eafa4d1.png)

3.3 下载并执行

<div class="highlight">

```
function getComponentFromBundle(bundleUrl, moduleName, version) {
  return window
    .fetch(bundleUrl, {
      method: "GET",
      dataType: "text"
    })
    .then(res => {
      return res.text();
    })
    .then(data => {
      eval(data);
      return moduleName && window.require(moduleName);
    })
    .catch(e => {
      // TODO report
    });
}
getComponentFromBundle(url, moudleName, version).then(component => {
      this.setState({ Card: component, status: 'success' });
    }).catch(e => {
// TODO report
});

```

</div>

如果你们有类似的场景，也可以我们来共同探讨哦。

推荐指数：****   
困难程度：**

## [](#12)4\. 有没有终极大招？

有，别写代码。 [认真脸~]
缩减代码体积是一个长期的过程，同时可能还有其它方式或者方法，如果你知道并且有实践，欢迎补充。