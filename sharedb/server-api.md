---
order: 2
---

## 服务端(Server) API

### 初始化

首先, 创建一个 `ShareDB` 服务器实例:

```js
var ShareDB = require('sharedb');
var share = new ShareDB(options);
```

**Options**

- **`options.db`**: _(`ShareDB.DB`的实例)_。使用这个数据库适配器存储文档和`ops`。默认为 `ShareDB.MemoryDB()`。
- **`options.pubsub`**: _(`ShareDB.PubSub`的实例)_。当数据通过此发布/订阅适配器更改时通知其他`ShareDB`进程。 默认为`ShareDB.MemoryPubSub()`。
- **`options.milestoneDb`**: _(ShareDB.MilestoneDB 的实例)_。 以指定的版本间隔存储文档快照
- **`options.presence`**: _boolean_。启用存在功能。默认情况下。注意, 此特性没有针对大量客户机进行优化, 可能会导致扇出问题

#### 数据库适配器

- `ShareDB.MemoryDB`: 由没有查询的非持久数据库支持
- [`ShareDBMongo`](https://github.com/share/sharedb-mongo): 由真实的`Mongo`数据库支持和完整的查询支持
- [`ShareDBMingoMemory`](https://github.com/share/sharedb-mingo-memory): 支持大多数`Mongo`查询的非持久数据库。 对于更快地测试基于 Mongo 的应用程序很有用。
- [`ShareDBPostgres`](https://github.com/share/sharedb-postgres): 由`PostgresQL`支持。 不支持查询。

#### 发布-订阅适配器

- `ShareDB.MemoryPubSub`: 可以与单个过程一起使用
- [`ShareDBRedisPubSub`](https://github.com/share/sharedb-redis-pubsub): 可以使用`Redis`的发布/订阅机制与多个进程一起使用

社区提供的**发布/订阅**适配器

- [wsbus](https://github.com/dmapper/sharedb-wsbus-pubsub)

#### Milestone 适配器

- [`sharedb-milestone-mongo`](https://github.com/share/sharedb-milestone-mongo): `Mongo` 支持

### 侦听 WebSocket 连接

```js
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');

// 'ws' is a websocket server connection, as passed into
// new (require('ws').Server).on('connection', ...)
var stream = new WebSocketJSONStream(ws);
share.listen(stream);
```

对于除`WebSocket`之外的其他传输, 公开一个可读写`JavaScript`对象的双工流。 然后将该流直接传递到 share.listen。

### 中间件

中间件使您可以进入`ShareDB`服务器管道。 在中间件代码中, 当对象流过`ShareDB`时, 您可以读取和修改它们。 例如, [`sharedb-access`](https://github.com/dmapper/sharedb-access)使用中间件来实现访问控制。

`share.use(action, fn)`: 注册一个新的中间件

- `action` _(String)_ 其中一个
  - `'connect'`: 连接到服务器的新客户端。
  - `'op'`: 从数据库加载了操作。
  - `'readSnapshots'`: 从数据库中加载了快照, 以获取或订阅查询或文档
  - `'query'`: 查询即将发送到数据库
  - `'submit'`: 将要向数据库提交一个操作
  - `'apply'`: 在将操作提交到数据库之前, 将对其进行操作
  - `'commit'`: 操作已应用于快照； 该操作和新快照将被写入数据库
  - `'afterWrite'`: 操作已成功写入数据库
  - `'receive'`: 从客户端收到一条消息
  - `'reply'`: 即将发送对客户端消息的无错误回复
  - `'sendPresence'`: 即将向客户端发送状态信息
- `fn` _(Function(context, callback))_ 在操作指定的时间调用此函数
  - `context` 始终具有以下属性
    - `action`: 该中间件正在处理的动作
    - `agent`: 对处理此客户端的服务器代理的引用
    - `backend`: 对此`ShareDB`后端实例的引用
  - `context` 也可以具有与操作相关的其他属性:
    - `collection`: 正在处理的集合名称
    - `id`: 正在处理的文档`id`
    - `op`: 正在处理的`op`
    - `req`: 正在处理`HTTP`请求(如果提供给`share.listen`(用于`'connect`))
    - `stream`: 提供给`share.listen`的双工流 (用于 `connect`)
    - `query`: 正在处理的查询对象 (用于 `query`)
    - `snapshots`: 检索快照的数组 (用于 `readSnapshots`)
    - `rejectSnapshotRead(snapshot, error)`: 拒绝特定的快照读取 (用于 `readSnapshots`)
      - `rejectSnapshotReadSilent(snapshot, errorMessage)`: 如上所述, 但是导致`ShareDB`客户端将其视为静默拒绝, 而不将错误传递回用户代码。
    - `data`: 收到客户端的消息 (用于 `receive`)
    - `request`: 已回复客户端的消息 (用于 `reply`)
    - `reply`: 要发送给客户端的回复 (用于 `reply`)

### 映射

`ShareDB`支持使用一组指定的(有限的)允许字段公开真实集合的映射。 配置完成后, 映射的收藏器看起来就像真实的收藏器 - 除了文档仅包含您要求的字段。 虚假收集工作中的操作(获取, 查询, 集合等), 但是您只能看到一小部分数据。

`addProjection(name, collection, fields)`配置

- `name` 映射集合的名称
- `collection` 现有集合的名称
- `fields` 文档中允许字段的映射(对象)
  - `Keys` 应该是`fields`的 `name`.
  - `Values` 应该为`true`

例如, 您可以进行`users_limited`投影, 使用户可以查看彼此的名称和个人资料图片, 但不能查看密码哈希。 您可以通过调用:

```js
share.addProjection('users_limited', 'users', { name: true, profileUrl: true });
```

请注意, 映射仅支持[JSON0 OT 类型](https://github.com/ottypes/json0)

### 记录

默认情况下, `ShareDB` 会输出到控制台。 如果您希望使静默日志或输出到自己的日志记录驱动程序或警报服务, 则可以覆盖此方法。

可以通过将类似`console`的对象传递给 `logger.setMethods` 来重写方法。

```javascript
var ShareDB = require('sharedb');
ShareDB.logger.setMethods({
  info: () => {}, // 静默日志信息
  warn: () => alerts.warn(arguments), // 将警告转发给警报服务
  error: () => alerts.critical(arguments), // 错误映射到关键警报
});
```

`ShareDB` 仅支持以下 `logger` 方法:

- `info`
- `warn`
- `error`

### 关闭

`share.close(callback)`: 关闭与数据库和`发布/订阅`适配器的连接。
