---
order: 1
---

_这篇文档是针对 `sharedb@1.x`。 如果需要使用 `sharedb@1.x-beta`, 请到 [the 1.x-beta branch](https://github.com/share/sharedb/tree/1.x-beta)查看文档。 如果需要升级, 请参阅[升级指南](https://github.com/share/sharedb/wiki/Upgrading-to-sharedb@1.0.0-from-1.0.0-beta)。_

# ShareDB

[![NPM Version](https://img.shields.io/npm/v/sharedb.svg)](https://npmjs.org/package/sharedb)
[![Build Status](https://travis-ci.org/share/sharedb.svg?branch=master)](https://travis-ci.org/share/sharedb)
[![Coverage Status](https://coveralls.io/repos/github/share/sharedb/badge.svg?branch=master)](https://coveralls.io/github/share/sharedb?branch=master)

[`ShareDB`](https://github.com/share/sharedb) 是一个基于 `JSON` 文档 [操作转换`(OT)`](https://en.wikipedia.org/wiki/Operational_transformation) 的实时数据库后端。它是 [`DerbyJS web`应用程序](http://derbyjs.com/) 的实时后端框架。

要了解问题、讨论和公告, 请加入 [`ShareJS` 邮件列表](https://groups.google.com/forum/?fromgroups#!forum/sharejs) 或[查看 FAQ](./docs/faq.md)。

当你发现的任何有关于`ShareDB`的错误, 欢迎提交[issue](https://github.com/share/sharedb/issues), 并与我们讨论、解决。

## 特性

- 实时同步任何`JSON`文档

- 并发多用户协作

- 具有异步最终一致性的同步编辑 `API`

- 实时查询订阅

- 与任何数据库轻松集成 - [MongoDB](https://github.com/share/sharedb-mongo), [PostgresQL(实验性)](https://github.com/share/sharedb-postgres)

- 通过[发布/订阅(pub/sub)集成](#发布-订阅适配器)可水平扩展

- 从文档和操作中选择所需字段的映射

- 用于实现访问控制和自定义扩展的中间件

- 非常适合在浏览器或服务器上使用

- 重新连接后脱机更改同步

- 用于单元测试的数据库和`pub/sub`的内存中实现

### 重新连接的示例

**TLDR**

```javascript
const WebSocket = require('reconnecting-websocket');
var socket = new WebSocket('ws://' + window.location.host);
var connection = new sharedb.Connection(socket);
```

提供给 `ShareDB` 的连接构造函数的原生 `Websocket` 对象 **不处理** 重新连接。

最简单的方法是给它一个重新连接的 `WebSocket` 对象。网上有很多这样的例子。最重要的是, 自定义重新连接的 `websocket` 必须具有与本机 `rfc6455` 版本相同的 `API`。

在 `textarea` 示例中, 我们通过使用 [reconnecting-websocket](https://github.com/pladaria/reconnecting-websocket) 这个库来实现重新连接的`Websocket`的演示。

## 示例

![简单的应用程序演示实时同步](/images/counter.gif)

<p align='center'>简单的应用程序演示实时同步</p>

![排行榜展示生活查询应用程序](/images/leaderboard.gif)

<p align='center'>排行榜展示生活查询应用程序</p>

## 数据模型

从 `ShareDB` 的角度来看，每个文档都具有 3 个属性:

- **version** - 从`0`开始的递增数
- **type** - `OT`类型。 OT 类型在 [`share/ottypes`](https://github.com/share/ottypes) 中定义。 隐式不存在的文档的类型为 `null`.
- **data** - 文档包含的实际数据。这必须是**纯非循环`JSON`**。它也是特定于类型的。(`JSON`类型使用原始`JSON`，文本文档使用字符串等)。

ShareDB 隐式包含您可以访问的每个文档的记录。 新文档的版本为 0，类型为空，没有数据。 要使用文档，您必须首先提交**`create` (创建)操作**，该操作将设置文档的类型并为其提供初始数据。 然后，您可以对文档提交编辑操作`(使用OT)`。 最后，您可以使用`delete`(删除)操作删除文档。 默认情况下，`ShareDB` 永久存储所有操作-没有什么是真正删除的。
