---
order: 3
---

## 客户端(Client) API

你可以从`Node`或浏览器使用客户端`API`。 首先, 通过连接到`ShareDB`服务器实例获取一个 ShareDB.Connection 对象:

`Node` 端:

```js
// `share` should be a ShareDB server instance
var connection = share.connect();
```

要从浏览器使用`ShareDB`, 请使用客户端捆绑程序, 如`Browserify`或`Webpack`。 以下代码通过 WebSockets 连接到`ShareDB`服务器实例:

```js
var ShareDB = require('sharedb/lib/client');
var socket = new WebSocket('ws://localhost:8080');
var connection = new ShareDB.Connection(socket);
```

对于除`WebSocket`之外的其他传输, 请创建一个实现`WebSocket`规范的对象, 然后将其传递到`ShareDB.Connection`构造函数中。.

### Class: `ShareDB.Connection`

获取给定集合和文档`ID`上的[`ShareDB.Doc`](#class-sharedbdoc)实例

从服务器获取查询结果。 `createSubscribeQuery`也会订阅更改。 返回一个[`ShareDB.Query`](#class-sharedbquery)实例。

- `query` _(Object)_: 具有数据库适配器定义的结构的数据库查询的描述符。
- `callback` _(Function)_: 服务器响应或错误时以`(err, results)`调用。
- `options.results` _(Array)_: 先前的查询结果`(如果有)`, 例如来自服务器渲染。
- `options.*`: 所有其他选项都传递给数据库适配器

`connection.fetchSnapshot(collection, id, version, callback): void`: 获取所请求版本的文档的**只读快照**。

- `collection` _(String)_: 快照的集合名称
- `id` _(String)_: 快照的 `id`
- `version` \_(number): **[可选]** 所需快照的版本号。 如果为`null`, 则获取最新版本。
- `callback` _(Function)_: 以`(error, snapshot)`一起调用, 其中`snapshot`采用以下形式

```javascript
{
  id: string; // ID of the snapshot
  v: number; // version number of the snapshot
  type: string; // the OT type of the snapshot, or null if it doesn't exist or is deleted
  data: any; // the snapshot
}
```

`connection.fetchSnapshotByTimestamp(collection, id, timestamp, callback): void`: 获取所需版本的文档的只读快照

- `collection` _(String)_: 快照的集合名称
- `id` _(String)_: 快照的 `id`
- `timestamp` \_(number) **[可选]**所需快照的时间戳。 返回的快照将是提供的时间戳之前的最新快照。 如果为`null`, 则获取最新版本。
- `callback` _(Function)_: 以`(error, snapshot)`一起调用, 其中`snapshot`采用以下形式

```javascript
{
  id: string; // ID of the snapshot
  v: number; // version number of the snapshot
  type: string; // the OT type of the snapshot, or null if it doesn't exist or is deleted
  data: any; // the snapshot
}
```

`connection.getPresence(channel): Presence`: 获取一个[`Presence`](#class-sharedbpresence)实例, 该实例可用于向其他客户端订阅在线信息, 并创建本地在线实例。

- `channel` _(String)_: 要订阅的 `Presence`

`connection.getDocPresence(collection, id): DocPresence`: 获取一个特殊的[`DocPresence`](#class-sharedbdocpresence)实例, 该实例可用于向其他客户端订阅状态信息, 并创建本地状态的实例。 这与**文档**相关联, 并且所有在场状态将根据操作自动转换以保持在场状态为最新状态。 请注意, **文档**必须是支持状态的类型。

- `collection` _(String)_: 文档集合
- `id` _(String)_: 文档 `id`

### Class: `ShareDB.Doc`

`doc.type` _(String_): 文档的 [OT type](https://github.com/ottypes/docs)

`doc.id` _(String)_: 唯一文档 `id`

`doc.data` _(Object)_: 文档内容。 在获取或订阅文档后可用。

`doc.fetch(function(err) {...})`: 使用服务器中文档的快照填充`doc`上的字段。

`doc.subscribe(function(err) {...})`: 使用服务器中文档的快照填充`doc`上的字段, 并在后续更改时触发事件。

`doc.unsubscribe(function (err) {...})`: 停止监听文档更新。 取消订阅时的文档数据保留在内存中, 但不再保持最新状态。 用`doc.subscribe`重新订阅。

`doc.ingestSnapshot(snapshot, callback)`: 输入快照数据。 快照参数必须包含字段`v(doc版本)`, 数据和类型`(OT类型)`。 通常, 此方法由于获取或订阅而在内部被调用, 而不是直接从用户代码中被调用。 但是, 仍然可以直接从用户代码中调用它, 以传递已传输到客户端`ShareDB`连接外部的客户端的数据, 例如与服务器的网页渲染一起发送的快照数据。

`doc.destroy()`: 取消订阅`(退订)`并停止触发事件。

`doc.on('load', function() {...})`: 文档的初始快照是从服务器加载的。 与**获取**和**订阅**的回调函数同时触发。

`doc.on('create', function(source) {...})`: 该文档已创建。 从技术上讲, 这意味着它具有类型。 对于从服务器接收到的`ops`, `source`将为`false`; 对于本地生成的`ops`, 默认为`true`。

`doc.on('before op'), function(op, source) {...})`: 即将对数据执行操作。 对于从服务器接收到的`ops`, `source`将为`false`; 对于本地生成的`ops`, 默认为`true`。

`doc.on('op', function(op, source) {...})`: 对数据进行了操作。 对于从服务器接收到的`ops`, `source`将为`false`; 对于本地生成的`ops`, 默认为`true`。

`doc.on('del', function(data, source) {...})`: 该文档已删除。 删除前的文档内容将作为参数传递。 对于从服务器接收到的`ops`, `source`将为`false`; 对于本地生成的`ops`, 默认为`true`。

`doc.on('error', function(err) {...})`: 提取文档或应用操作时出错。

`doc.removeListener(eventName, listener)`: 删除您用`doc.on`添加的所有侦听器。 `eventName`应该是 `load`, `create`, `before op`, `op`, `del`或 `error`之一。 侦听器应该是您作为`on`的第二个参数传入的函数。 请注意, `on`和`removeListener`均从[EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter)继承。

`doc.create(data[, type][, options][, function(err) {...}])`
在本地创建文档, 然后将创建操作发送到服务器。

- `data` 初始文档内容
- `type` _([OT type](https://github.com/ottypes/docs))_ 默认为`ot-json0`, 其数据为对象
- `options.source` 参数传递给本地的`create`事件。它不会发送到服务器或其他客户端。默认值为`true`。

`doc.submitOp(op, [, options][, function(err) {...}])`: 将操作应用于文档并将其发送到服务器。`op` 结构取决于文档类型。请参阅有关
[默认`ot-json0`类型的操作](https://github.com/ottypes/json0#summary-of-operations)。在获取或订阅文档后调用此函数。

- `options.source` 参数传递给本地的`create`事件。它不会发送到服务器或其他客户端。默认值为`true`。

`doc.del([options][, function(err) {...}])`: 在本地删除文档, 然后将删除操作发送到服务器。 在获取或订阅文档后调用此函数。

- `options.source`: 参数传递给本地的 `del`事件。 这不会发送到服务器或其他客户端。 默认为`true`。

`doc.whenNothingPending(function(err) {...})`: 在之后调用给定的回调函数

- 通过`doc.submitOp`提交的所有操作均已发送到服务器, 并且所有待处理的提取, 订阅和取消订阅请求均已解决。

请注意, `whenNothingPending`不等待挂起的`model.query()`调用。

`doc.pause()`: 防止将自己的操作提交给服务器。 如果订阅, 仍将接收远程操作。

`doc.resume()`: 如果暂停, 请继续将自己的操作发送到服务器。 调用时将刷新排队的操作。

### Class: `ShareDB.Query`

`query.ready` _(Boolean)_: 如果查询结果已准备就绪且可在`query.results`上使用, 则为`true`

`query.results` _(Array)_: 查询结果, 作为[`ShareDB.Doc`](#class-sharedbdoc)实例的数组

`query.extra` : (类型取决于数据库适配器和查询)不是文档数组的额外查询结果。可用于某些数据库适配器和查询。

`query.on('ready', function() {...}))`: 初始查询结果是从服务器加载的。 与`createFetchQuery`和`createSubscribeQuery`的回调同时触发。

`query.on('error', function(err) {...}))`: 接收更新时的订阅错误处理。

`query.destroy()`: 取消订阅(退订)并停止触发事件。

`query.on('changed', function(results) {...}))`: (仅在订阅查询时触发)查询结果已更改。 处理一系列差异后仅触发一次。

`query.on('insert', function(docs, atIndex) {...}))`: (仅在订阅查询时触发)将连续的文档序列**添加**到查询结果数组。

`query.on('move', function(docs, from, to) {...}))`: (仅在订阅查询时触发) 将连续的文档序列**移动**到查询结果数组。

`query.on('remove', function(docs, atIndex) {...}))`: (仅在订阅查询时触发) 将连续的文档序列**移除**到查询结果数组。

`query.on('extra', function() {...}))`: (仅在订阅查询时触发)`query.extra` 变化.

### Class: `ShareDB.Backend`

后端代表`ShareDB`的服务器端实例。 它主要负责连接到客户端, 并将请求发送到数据库适配器。 它还负责某些配置, 例如设置[middleware](#middlewares)和 [projections](#projections)。

#### `constructor`

```javascript
var Backend = require('sharedb');
var backend = new Backend(options);
```

使用提供的选项构造一个新的`Backend`实例:

- `db` _DB (optional)_: 一个为`ShareDB`提供数据存储的`ShareDB` [database adapter](#database-adapters)的实例。 如果省略, 将创建一个新的非持久内存适配器, 该适配器不应在生产中使用, 但可能对测试有用
- `pubsub` _PubSub (optional)_: `ShareDB` [Pub/Sub adapter](#pubsub-adapters)适配器的实例, 它提供了一个通道来通知其他`ShareDB`实例数据更改。 如果省略, 将创建一个新的内存适配器。与数据库适配器不同, 内存实例可以在生产环境中使用, 在该生产环境中, **发布/订阅**状态仅需要在单个独立服务器上持久存在
- `milestoneDb` _MilestoneDB (optional)_: 一个`ShareDB` [`milestone adapter`](#milestone-adapters) 的实例, 该实例为`milestone adapter`提供数据存储, `milestone adapter`是按指定版本间隔存储的文档的历史快照。 如果省略, 则不会启用此功能
- `extraDbs` _Object (optional)_: 一个对象, 其值是可以[查询](#class-sharedbquery)的额外数据库实例。 键是可以传递到查询选项数据库字段中的名称
- `suppressPublish` _boolean (optional)_: 如果设置为`true`, 则提交的任何更改都不会在`pubsub`上发布
- `maxSubmitRetries` _number (optional)_: 允许重试提交的次数。如果省略, 请求将重试无限次

#### `connect`

```javascript
var connection = backend.connect();
```

连接到`ShareDB`并返回一个[`Connection`](#class-sharedbconnection)的实例。 这跟在浏览器中`new ShareDBClient.Connection(socket)`的实例是一样的。

此方法还支持不常用的可选参数:

```javascript
var connection = backend.connect(connection, req);
```

- `connection` _Connection (optional)_: 要绑定到`Backend`的[`Connection`](#class-sharedbconnection)实例
- `req` _Object (optional)_: 连接上下文对象, 它可以包含将在[中间件](server-api#中间件)中可用的信息, 如 `cookie` 或会话数据。

返回一个 [`Connection`](#class-sharedbconnection)。

#### `listen`

```javascript
var agent = backend.listen(stream, req);
```

向后端注册`Stream`。 当服务器从客户端收到新连接时, 应调用此方法。

- `stream` _Stream_: 一个[`Stream`](https://nodejs.org/api/stream.html)(或类似流的对象), 将用于在新**代理**与**后端**之间进行通信
- `req` _Object (optional)_: 连接上下文对象, 该对象可以包含[中间件](server-api#中间件)中可用的信息, 例如`cookie`或会话数据

返回一个[代理](#class-sharedbagent), 该代理在[中间件](server-api#中间件)中也可用。

#### `close`

```javascript
backend.close(callback);
```

断开`ShareDB`及其所有基础服务(数据库, `pubsub`等)的连接。

- `callback` _Function_: 带有签名函数的 `function (error: Error): void`回调, 在服务停止时调用, 或者在服务中至少有一个不能停止时出现错误

#### `use`

```javascript
backend.use(action, middleware);
```

将[中间件](server-api#中间件)添加到后端。

- `action` _string | string[]_: 定义何时应用**中间件**的**操作或操作名称**数组
- `middleware` _Function_: 具有签名的中间件 `function (context: Object, callback: Function): void` 有关更多详细信息, 请参见[中间件](server-api#中间件)

返回`Backend`实例, 该实例允许多个链接调用。

#### `addProjection`

```javascript
backend.addProjection(name, collection, fields);
```

添加一个 [projection](#projections).

- `name` _string_: `projection` 的名字
- `collection` _string_: 应用映射的集合的名称
- `fields` _Object_: 包含在映射中的字段的声明, 例如`{field1: true}`。 不支持定义子映射。

#### `submit`

```javascript
backend.submit(agent, index, id, op, options, callback);
```

向 `Backend` 提交 `op` 操作

- `agent` _[`Agent`](#class-sharedbagent)_: 连接`agent`传递给中间件
- `index` _string_: 目标集合或映射的名称
- `id` _string_: 文档`id`
- `op` _Object_: 提交的 `op`
- `options` _Object_:这些选项将传递到数据库适配器的`commit`方法, 因此可以在此处使用此处有效的任何选项
- `callback` _Function_: 具有签名函数的回调函数`function (error: Error, ops: Object[]): void`, 其中`ops`是在提交的`op`和提交的`op`之间由其他客户端提交的`ops`

#### `getOps`

```javascript
backend.getOps(agent, index, id, from, to, options, callback);
```

在所请求的版本号之间获取文档的`op`操作, 其中`from`值包括在内, 而`to`值不包括在内。

- `agent` _[`Agent`](#class-sharedbagent)_: 连接`agent`传递给中间件
- `index` _string_: 目标集合或映射的名称
- `id` _string_: 文档`id`
- `from` _number_: 获取的第一个`op`版本。 如果设置为`null`, 则将从最早的版本中获取操作
- `to` _number_: 最后一个 op 版本。 此版本将不会被获取(即, 不包含在内)。 如果设置为`null`, 则将获取操作的最新版本
- `options`: _Object (optional)_: 选项可以直接传递给`opts Options`属性 `{opsOptions: {metadata: true}}`中的数据库驱动程序的 getOpts
- `callback`: _Function_: 具有签名函数的回调函数`function (error: Error, ops: Object[]): void`, 其中`ops`是所请求的`ops`的数组

#### `getOpsBulk`

```javascript
backend.getOpsBulk(agent, index, fromMap, toMap, options, callback);
```

在所请求的版本号之间获取集合中多个文档的操作, 其中`from`值包括在内, 而 to 值不包括在内。

- `agent` _[`Agent`](#class-sharedbagent)_: 连接`agent`传递给中间件
- `index` _string_: 目标集合或映射的名称
- `id` _string_: 文档`id`
- `fromMap` _Object_: 一个对象, 其键是目标文档的`ID`。 这些值是每个文档要求的第一个版本。 例如, `{abc: 3}`将从版本`3`(含)起获取`ID`为`abc`的文档的操作
- `toMap` _Object_: 一个对象, 其键是目标文档的`ID`。 值是每个文档要求的最新版本(不包括在内)。 例如, {abc: 3}将获取 ID 为`abc`直至`3`版本(不包括在内)的文档的操作
- `options`: _Object (optional)_: 选项可以直接传递到`opsOptions`属性内的数据库驱动程序的`getOpsBulk: {opsOptions: {metadata: true}}`
- `callback`: _Function_: 具有签名函数的回调函数`function (error: Error, opsMap: Object): void;`, 其中`opsMap`是一个对象, 其键是请求的文档的`ID`, 其值是请求的操作的数组, 例如`{abc: [] }`

#### `fetch`

```javascript
backend.fetch(agent, index, id, options, callback);
```

获取文档的当前快照。

- `agent` _[`Agent`](#class-sharedbagent)_: 连接`agent`传递给中间件
- `index` _string_: 目标集合或映射的名称
- `id` _string_: 文档`id`
- `options`: _Object (optional)_: 选项可以直接传递到`snapshotOptions`属性内的数据库驱动程序的`fetch`中: `{snapshotOptions: {metadata: true}}`
- `callback`: _Function_: 具有签名函数的回调函数`function (error: Error, snapshot: Snapshot): void`, 其中快照是请求的快照

#### `fetchBulk`

```javascript
backend.fetchBulk(agent, index, ids, options, callback);
```

从集合中获取多个文档快照。

- `agent` _[`Agent`](#class-sharedbagent)_: 连接`agent`传递给中间件
- `index` _string_: 目标集合或映射的名称
- `ids` _string[]_: 文档`ids`的数组
- `options`: _Object (optional)_: 选项可以在`snapshotOptions`属性中直接传递给数据库驱动程序的`fetchBulk`: `{snapshotOptions: {metadata: true}}`
- `callback`: _Function_: 带有签名函数的`function (error: Error, snapshotMap: Object): void`, 其中`snapshotMap`是一个对象, 其键是请求的`id`, 值是请求的快照

#### `queryFetch`

```javascript
backend.queryFetch(agent, index, query, options, callback);
```

获取与提供的查询匹配的快照。 在大多数情况下, 应首选直接查询支持数据库, 但可以使用`queryFetch`来应用中间件, 同时避免与使用`Doc`实例相关的开销。

- `agent` _[`Agent`](#class-sharedbagent)_: 连接代理传递给中间件
- `index` _string_: 目标集合或映射的名称
- `query` _Object_: 查询对象, 其格式将取决于所使用的数据库适配器
- `options` _Object_: 一个可能包含`db`属性的对象, 该属性指定要对哪个数据库运行查询。 这些额外的数据库可以通过`Backend`构造函数中的`extraDbs`选项附加
- `callback` _Function_: 带有签名函数的 `function (error: Error, snapshots: Snapshot[], extra: Object): void`, 其中, `Snapshot`是与查询匹配的快照的数组, `extra`是一个(可选的)对象, 数据库适配器可能返回更多关于结果的信息(比如计数)

### Class: `ShareDB.Agent`

`Agent` 是服务器上客户端连接状态的表示。 如果连接是通过`backend.connect`创建的(即客户端正在服务器上运行), 则可以通过直接引用: `connection。agent` 访问与连接关联的代理。

该代理`(Agent)`将在所有[中间件](server-api#中间件)请求中可用。 `agent.custom`字段是一个对象, 可用于存储在中间件中使用的任意信息。 例如

```javascript
backend.use('connect', (request, callback) => {
  // 进行克隆以防止在连接后使对象变异的最佳实践。
  // 您可能还需要考虑深克隆, 具体取决于 request.req 的结构。
  Object.assign(request.agent.custom, request.req);
  callback();
});

backend.use('readSnapshots', (request, callback) => {
  const connectionInfo = request.agent.custom;
  const snapshots = request.snapshots;

  // 使用连接时提供的信息来确定用户是否可以访问快照。
  // 在获取和提交操作时也应检查此内容。
  if (!userCanAccessCollection(connectionInfo, request.collection)) {
    return callback(new Error('Not allowed to access collection ' + request.collection));
  }
  // 分别检查每个快照
  for (const snapshot of snapshots) {
    if (!userCanAccessSnapshot(connectionInfo, request.collection, snapshot)) {
      request.rejectSnapshotRead(snapshot,
        new Error('Not allowed to access snapshot in ' request.collection));
    }
  }

  callback();
});

// 在这里, 您应该确定用户具有哪些权限, 可能是通过读取 cookie 并可能通过发出一些数据库请求
// 来检查他们可以访问的文档或他们具有的角色等。
// 如果异步执行此操作, 请确保调用 backend.connect 取得权限后。
const connectionInfo = getUserPermissions();
// 传递信息作为第二个参数。 这将在 connection 中间件中作为 request.req 提供。
const connection = backend.connect(null, connectionInfo);
```

### Class: `ShareDB.Presence`

与给定通道关联的 `presence` 数据的表示形式。

#### `subscribe`

```javascript
presence.subscribe(callback): void;
```

订阅其他客户端的状态更新。请注意, 可以在不订阅的情况下提交状态, 但是如果您未订阅, 远程客户端将无法从您那里重新请求状态。

- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

#### `unsubscribe`

```javascript
presence.unsubscribe(callback): void;
```

取消订阅(退订)远程客户端的状态更新。

- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

#### `on`

```javascript
presence.on('receive', callback): void;
```

收到来自远程状态客户端的更新。

- `callback` _Function_: 用于处理收到的 `presence` 的回调: `function (presenceId, presenceValue): void;`

```javascript
presence.on('error', callback): void;
```

出现与`presence`相关的错误。

- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

#### `create`

```javascript
presence.create(presenceId): LocalPresence;
```

创建[`LocalPresence`](#class-sharedblocalpresence)的实例, 该实例可用于表示本地状态。`Presence` 实例上可能不存在许多此类本地存在或不存在。

- `presenceId` _string (optional)_: 代表本地存在的唯一`ID`。 请记住-根据用例-同一客户端可能具有多个状态, 因此不一定是用户或客户端`ID`。 如果未提供, 则会为您分配一个随机`ID`。

#### `destroy`

```javascript
presence.destroy(callback);
```

使用`空状态 (null)`更新所有远程客户端, 并将其从`Connection`缓存中删除, 以便可以对其进行垃圾回收。 当您完成状态时, 应调用此方法, 而不再需要使用它来触发更新。

- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

### Class: `ShareDB.DocPresence`

[`Presence`](#class-sharedbpresence)的特殊情况, 与特定[`Doc`](#class-sharedbdoc)相关。 与关联文档一起使用状态时, 应用于文档的所有`操作(op)`都会自动用于转换关联状态。 销毁后, `DocPresence`将从`Doc`中注销其侦听器。

有关可用方法, 请参见 [`Presence`](#class-sharedbpresence)。

### Class: `ShareDB.LocalPresence`

`LocalPresence`表示给定`Doc`中本地客户端的存在。 例如, 这可能是插入符号在文本文档中的位置; 在复杂的`JSON`对象中突出显示了哪个字段; 等等。即使在同一客户端上, 每个`Doc`也可能存在多个状态。

#### `submit`

```javascript
localPresence.submit(presence, callback): void;
```

更新本地的在线状态表示, 并将该在线状态广播给任何其他文档在线状态订阅者。

- `presence` _Object_: 要广播的状态对象。 其结构将取决于`OT`类型
- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

#### `send`

```javascript
localPresence.send(callback): void;
```

发送状态, 例如`submit`, 但不更新值。 如果本地用户定期过期, 该功能很有用。

- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

#### `destroy`

```javascript
localPresence.destroy(callback): void;
```

通知所有远程客户端此状态现在为空, 并删除自身以进行垃圾回收。

- `callback` _Function_: 带有函数 `function (error: Error): void`签名的回调

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
