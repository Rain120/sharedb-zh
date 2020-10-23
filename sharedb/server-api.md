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

- **`options.db`**
  _(`ShareDB.DB`的实例)_。使用这个数据库适配器存储文档和`ops`。默认为 `ShareDB.MemoryDB()`。
- **`options.pubsub`**
  _(`ShareDB.PubSub`的实例)_。当数据通过此发布/订阅适配器更改时通知其他`ShareDB`进程。 默认为`ShareDB.MemoryPubSub()`。
- **`options.milestoneDb`**
  _(ShareDB.MilestoneDB 的实例)_。 以指定的版本间隔存储文档快照
- **`options.presence`**
  _boolean_。启用存在功能。默认情况下。注意, 此特性没有针对大量客户机进行优化, 可能会导致扇出问题

#### 数据库适配器

- `ShareDB.MemoryDB`, backed by a non-persistent database with no queries
- [`ShareDBMongo`](https://github.com/share/sharedb-mongo), backed by a real Mongo database
  and full query support
- [`ShareDBMingoMemory`](https://github.com/share/sharedb-mingo-memory), backed by
  a non-persistent database supporting most Mongo queries. Useful for faster
  testing of a Mongo-based app.
- [`ShareDBPostgres`](https://github.com/share/sharedb-postgres), backed by PostgresQL. No query support.

#### 发布-订阅适配器

- `ShareDB.MemoryPubSub` can be used with a single process
- [`ShareDBRedisPubSub`](https://github.com/share/sharedb-redis-pubsub) can be used
  with multiple processes using Redis' pub/sub mechanism

Community Provided Pub/Sub Adapters

- [wsbus](https://github.com/dmapper/sharedb-wsbus-pubsub)

#### Milestone 适配器

- [`sharedb-milestone-mongo`](https://github.com/share/sharedb-milestone-mongo), backed by Mongo

### 侦听 WebSocket 连接

```js
var WebSocketJSONStream = require('@teamwork/websocket-json-stream');

// 'ws' is a websocket server connection, as passed into
// new (require('ws').Server).on('connection', ...)
var stream = new WebSocketJSONStream(ws);
share.listen(stream);
```

For transports other than WebSockets, expose a duplex
stream that writes and reads JavaScript objects. Then
pass that stream directly into `share.listen`.

### 中间件

Middlewares let you hook into the ShareDB server pipeline. In
middleware code you can read and also modify objects as they
flow through ShareDB. For example,
[sharedb-access](https://github.com/dmapper/sharedb-access) uses middlewares
to implement access control.

`share.use(action, fn)`
Register a new middleware.

- `action` _(String)_
  One of:
  - `'connect'`: A new client connected to the server.
  - `'op'`: An operation was loaded from the database.
  - `'readSnapshots'`: Snapshot(s) were loaded from the database for a fetch or subscribe of a query or document
  - `'query'`: A query is about to be sent to the database
  - `'submit'`: An operation is about to be submitted to the database
  - `'apply'`: An operation is about to be applied to a snapshot
    before being committed to the database
  - `'commit'`: An operation was applied to a snapshot; The operation
    and new snapshot are about to be written to the database.
  - `'afterWrite'`: An operation was successfully written to
    the database.
  - `'receive'`: Received a message from a client
  - `'reply'`: About to send a non-error reply to a client message
  - `'sendPresence'`: About to send presence information to a client
- `fn` _(Function(context, callback))_
  Call this function at the time specified by `action`.
  - `context` will always have the following properties:
    - `action`: The action this middleware is handling
    - `agent`: A reference to the server agent handling this client
    - `backend`: A reference to this ShareDB backend instance
  - `context` can also have additional properties, as relevant for the action:
    - `collection`: The collection name being handled
    - `id`: The document id being handled
    - `op`: The op being handled
    - `req`: HTTP request being handled, if provided to `share.listen` (for 'connect')
    - `stream`: The duplex Stream provided to `share.listen` (for 'connect')
    - `query`: The query object being handled (for 'query')
    - `snapshots`: Array of retrieved snapshots (for 'readSnapshots')
    - `rejectSnapshotRead(snapshot, error)`: Reject a specific snapshot read (for 'readSnapshots')
      - `rejectSnapshotReadSilent(snapshot, errorMessage)`: As above, but causes the ShareDB client to treat it as a silent rejection, not passing the error back to user code.
    - `data`: Received client message (for 'receive')
    - `request`: Client message being replied to (for 'reply')
    - `reply`: Reply to be sent to the client (for 'reply')

### 映射

ShareDB supports exposing a _projection_ of a real collection, with a specified (limited) set of allowed fields. Once configured, the projected collection looks just like a real collection - except documents only have the fields you've requested. Operations (gets, queries, sets, etc) on the fake collection work, but you only see a small portion of the data.

`addProjection(name, collection, fields)`
Configure a projection.

- `name` The name of the projected collection.
- `collection` The name of the existing collection.
- `fields` A map (object) of the allowed fields in documents.
  - Keys are field names.
  - Values should be `true`.

For example, you could make a `users_limited` projection which lets users view each other's names and profile pictures, but not password hashes. You would configure this by calling:

```js
share.addProjection('users_limited', 'users', { name: true, profileUrl: true });
```

Note that only the [JSON0 OT type](https://github.com/ottypes/json0) is supported for projections.

### 记录

By default, ShareDB logs to `console`. This can be overridden if you wish to silence logs, or to log to your own logging driver or alert service.

Methods can be overridden by passing a [`console`-like object](https://developer.mozilla.org/en-US/docs/Web/API/console) to `logger.setMethods`:

```javascript
var ShareDB = require('sharedb');
ShareDB.logger.setMethods({
  info: () => {}, // Silence info
  warn: () => alerts.warn(arguments), // Forward warnings to alerting service
  error: () => alerts.critical(arguments), // Remap errors to critical alerts
});
```

ShareDB only supports the following logger methods:

- `info`
- `warn`
- `error`

### 关闭

`share.close(callback)`
Closes connections to the database and pub/sub adapters.
