---
order: 3
---

## 客户端(Client) API

The client API can be used from either Node or a browser. First, get a `ShareDB.Connection` object by connecting to the ShareDB server instance:

From Node:

```js
// `share` should be a ShareDB server instance
var connection = share.connect();
```

To use ShareDB from a browser, use a client bundler like Browserify or Webpack. The following
code connects to the ShareDB server instance over WebSockets:

```js
var ShareDB = require('sharedb/lib/client');
var socket = new WebSocket('ws://localhost:8080');
var connection = new ShareDB.Connection(socket);
```

For transports other than WebSockets, create an object implementing
the WebSocket specification and pass it into the `ShareDB.Connection` constructor.

### Class: `ShareDB.Connection`

`connection.get(collectionName, documentId)`
Get a [`ShareDB.Doc`](#class-sharedbdoc) instance on a given collection and document ID.

`connection.createFetchQuery(collectionName, query, options, callback)`
`connection.createSubscribeQuery(collectionName, query, options, callback)`
Get query results from the server. `createSubscribeQuery` also subscribes to
changes. Returns a [`ShareDB.Query`](#class-sharedbquery) instance.

- `query` _(Object)_
  A descriptor of a database query with structure defined by the database adapter.
- `callback` _(Function)_
  Called with `(err, results)` when server responds, or on error.
- `options.results` _(Array)_
  Prior query results if available, such as from server rendering.
- `options.*`
  All other options are passed through to the database adapter.

`connection.fetchSnapshot(collection, id, version, callback): void;`
Get a read-only snapshot of a document at the requested version.

- `collection` _(String)_
  Collection name of the snapshot
- `id` _(String)_
  ID of the snapshot
- `version` _(number) [optional]_
  The version number of the desired snapshot. If `null`, the latest version is fetched.
- `callback` _(Function)_
  Called with `(error, snapshot)`, where `snapshot` takes the following form:

  ```javascript
  {
    id: string; // ID of the snapshot
    v: number; // version number of the snapshot
    type: string; // the OT type of the snapshot, or null if it doesn't exist or is deleted
    data: any; // the snapshot
  }
  ```

`connection.fetchSnapshotByTimestamp(collection, id, timestamp, callback): void;`
Get a read-only snapshot of a document at the requested version.

- `collection` _(String)_
  Collection name of the snapshot
- `id` _(String)_
  ID of the snapshot
- `timestamp` _(number) [optional]_
  The timestamp of the desired snapshot. The returned snapshot will be the latest snapshot before the provided timestamp. If `null`, the latest version is fetched.
- `callback` _(Function)_
  Called with `(error, snapshot)`, where `snapshot` takes the following form:

  ```javascript
  {
    id: string; // ID of the snapshot
    v: number; // version number of the snapshot
    type: string; // the OT type of the snapshot, or null if it doesn't exist or is deleted
    data: any; // the snapshot
  }
  ```

`connection.getPresence(channel): Presence;`
Get a [`Presence`](#class-sharedbpresence) instance that can be used to subscribe to presence information to other clients, and create instances of local presence.

- `channel` _(String)_
  Presence channel to subscribe to

`connection.getDocPresence(collection, id): DocPresence;`
Get a special [`DocPresence`](#class-sharedbdocpresence) instance that can be used to subscribe to presence information to other clients, and create instances of local presence. This is tied to a `Doc`, and all presence will be automatically transformed against ops to keep presence current. Note that the `Doc` must be of a type that supports presence.

- `collection` _(String)_
  Document collection
- `id` _(String)_
  Document ID

### Class: `ShareDB.Doc`

`doc.type` _(String_)
The [OT type](https://github.com/ottypes/docs) of this document

`doc.id` _(String)_
Unique document ID

`doc.data` _(Object)_
Document contents. Available after document is fetched or subscribed to.

`doc.fetch(function(err) {...})`
Populate the fields on `doc` with a snapshot of the document from the server.

`doc.subscribe(function(err) {...})`
Populate the fields on `doc` with a snapshot of the document from the server, and
fire events on subsequent changes.

`doc.unsubscribe(function (err) {...})`
Stop listening for document updates. The document data at the time of unsubscribing remains in memory, but no longer stays up-to-date. Resubscribe with `doc.subscribe`.

`doc.ingestSnapshot(snapshot, callback)`
Ingest snapshot data. The `snapshot` param must include the fields `v` (doc version), `data`, and `type` (OT type). This method is generally called interally as a result of fetch or subscribe and not directly from user code. However, it may still be called directly from user code to pass data that was transferred to the client external to the client's ShareDB connection, such as snapshot data sent along with server rendering of a webpage.

`doc.destroy()`
Unsubscribe and stop firing events.

`doc.on('load', function() {...})`
The initial snapshot of the document was loaded from the server. Fires at the
same time as callbacks to `fetch` and `subscribe`.

`doc.on('create', function(source) {...})`
The document was created. Technically, this means it has a type. `source` will be `false` for ops received from the server and defaults to `true` for ops generated locally.

`doc.on('before op'), function(op, source) {...})`
An operation is about to be applied to the data. `source` will be `false` for ops received from the server and defaults to `true` for ops generated locally.

`doc.on('op', function(op, source) {...})`
An operation was applied to the data. `source` will be `false` for ops received from the server and defaults to `true` for ops generated locally.

`doc.on('del', function(data, source) {...})`
The document was deleted. Document contents before deletion are passed in as an argument. `source` will be `false` for ops received from the server and defaults to `true` for ops generated locally.

`doc.on('error', function(err) {...})`
There was an error fetching the document or applying an operation.

`doc.removeListener(eventName, listener)`
Removes any listener you added with `doc.on`. `eventName` should be one of `'load'`, `'create'`, `'before op'`, `'op'`, `'del'`, or `'error'`. `listener` should be the function you passed in as the second argument to `on`. Note that both `on` and `removeListener` are inherited from [EventEmitter](https://nodejs.org/api/events.html#events_class_eventemitter).

`doc.create(data[, type][, options][, function(err) {...}])`
在本地创建文档，然后将创建操作发送到服务器。

- `data` 初始文档内容
- `type` _([OT type](https://github.com/ottypes/docs))_ 默认为`ot-json0`，其数据为对象
- `options.source` 参数传递给本地的`create`事件。它不会发送到服务器或其他客户端。默认值为`true`。

`doc.submitOp(op, [, options][, function(err) {...}])`
将操作应用于文档并将其发送到服务器。`op` 结构取决于文档类型。请参阅有关
[默认`ot-json0`类型的操作](https://github.com/ottypes/json0#summary-of-operations)。在获取或订阅文档后调用此函数。

- `options.source` 参数传递给本地的`create`事件。它不会发送到服务器或其他客户端。默认值为`true`。

`doc.del([options][, function(err) {...}])`
Delete the document locally and send delete operation to the server.
Call this after you've either fetched or subscribed to the document.

- `options.source` Argument passed to the `'del'` event locally. This is not sent to the server or other clients. Defaults to `true`.

`doc.whenNothingPending(function(err) {...})`
Invokes the given callback function after

- all ops submitted via `doc.submitOp` have been sent to the server, and
- all pending fetch, subscribe, and unsubscribe requests have been resolved.

Note that `whenNothingPending` does NOT wait for pending `model.query()` calls.

`doc.pause()`
Prevents own ops being submitted to the server. If subscribed, remote ops will still be received.

`doc.resume()`
Resume sending own ops to the server if paused. Will flush the queued ops when called.

### Class: `ShareDB.Query`

`query.ready` _(Boolean)_
True if query results are ready and available on `query.results`

`query.results` _(Array)_
Query results, as an array of [`ShareDB.Doc`](#class-sharedbdoc) instances.

`query.extra` _(Type depends on database adapter and query)_
Extra query results that aren't an array of documents. Available for certain database adapters and queries.

`query.on('ready', function() {...}))`
The initial query results were loaded from the server. Fires at the same time as
the callbacks to `createFetchQuery` and `createSubscribeQuery`.

`query.on('error', function(err) {...}))`
There was an error receiving updates to a subscription.

`query.destroy()`
Unsubscribe and stop firing events.

`query.on('changed', function(results) {...}))`
(Only fires on subscription queries) The query results changed. Fires only once
after a sequence of diffs are handled.

`query.on('insert', function(docs, atIndex) {...}))`
(Only fires on subscription queries) A contiguous sequence of documents were added to the query result array.

`query.on('move', function(docs, from, to) {...}))`
(Only fires on subscription queries) A contiguous sequence of documents moved position in the query result array.

`query.on('remove', function(docs, atIndex) {...}))`
(Only fires on subscription queries) A contiguous sequence of documents were removed from the query result array.

`query.on('extra', function() {...}))`
(Only fires on subscription queries) `query.extra` changed.

### Class: `ShareDB.Backend`

`Backend` represents the server-side instance of ShareDB. It is primarily responsible for connecting to clients, and sending requests to the database adapters. It is also responsible for some configuration, such as setting up [middleware](#middlewares) and [projections](#projections).

#### `constructor`

```javascript
var Backend = require('sharedb');
var backend = new Backend(options);
```

Constructs a new `Backend` instance, with the provided options:

- `db` _DB (optional)_: an instance of a ShareDB [database adapter](#database-adapters) that provides the data store for ShareDB. If omitted, a new, non-persistent, in-memory adapter will be created, which should _not_ be used in production, but may be useful for testing
- `pubsub` _PubSub (optional)_: an instance of a ShareDB [Pub/Sub adapter](#pubsub-adapters) that provides a channel for notifying other ShareDB instances of changes to data. If omitted, a new, in-memory adapter will be created. Unlike the database adapter, the in-memory instance _may_ be used in a production environment where pub/sub state need only persist across a single, stand-alone server
- `milestoneDb` _MilestoneDB (optional)_: an instance of a ShareDB [milestone adapter](#milestone-adapters) that provides the data store for milestone snapshots, which are historical snapshots of documents stored at a specified version interval. If omitted, this functionality will not be enabled
- `extraDbs` _Object (optional)_: an object whose values are extra `DB` instances which can be [queried](#class-sharedbquery). The keys are the names that can be passed into the query options `db` field
- `suppressPublish` _boolean (optional)_: if set to `true`, any changes committed will _not_ be published on `pubsub`
- `maxSubmitRetries` _number (optional)_: the number of times to allow a submit to be retried. If omitted, the request will retry an unlimited number of times

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
- `req` _Object (optional)_: 连接上下文对象，它可以包含将在[中间件](#中间件)中可用的信息，如 cookie 或会话数据。

返回一个 [`Connection`](#class-sharedbconnection)。

#### `listen`

```javascript
var agent = backend.listen(stream, req);
```

Registers a `Stream` with the backend. This should be called when the server receives a new connection from a client.

- `stream` _Stream_: a [`Stream`](https://nodejs.org/api/stream.html) (or `Stream`-like object) that will be used to communicate between the new `Agent` and the `Backend`
- `req` _Object (optional)_: a connection context object that can contain information such as cookies or session data that will be available in the [middleware](#middlewares)

Returns an [`Agent`](#class-agent), which is also available in the [middleware](#middlewares).

#### `close`

```javascript
backend.close(callback);
```

Disconnects ShareDB and all of its underlying services (database, pubsub, etc.).

- `callback` _Function_: a callback with the signature `function (error: Error): void` that will be called once the services have stopped, or with an `error` if at least one of them could not be stopped

#### `use`

```javascript
backend.use(action, middleware);
```

Adds [middleware](#middlewares) to the `Backend`.

- `action` _string | string[]_: an action, or array of action names defining when to apply the middleware
- `middleware` _Function_: a middleware function with the signature `function (context: Object, callback: Function): void;`. See [middleware](#middlewares) for more details

Returns the `Backend` instance, which allows for multiple chained calls.

#### `addProjection`

```javascript
backend.addProjection(name, collection, fields);
```

Adds a [projection](#projections).

- `name` _string_: the name of the projection
- `collection` _string_: the name of the collection on which to apply the projection
- `fields` _Object_: a declaration of which fields to include in the projection, such as `{ field1: true }`. Defining sub-field projections is not supported.

#### `submit`

```javascript
backend.submit(agent, index, id, op, options, callback);
```

Submits an operation to the `Backend`.

- `agent` _[`Agent`](#class-agent)_: connection agent to pass to the middleware
- `index` _string_: the name of the target collection or projection
- `id` _string_: the document ID
- `op` _Object_: the operation to submit
- `options` _Object_: these options are passed through to the database adapter's `commit` method, so any options that are valid there can be used here
- `callback` _Function_: a callback with the signature `function (error: Error, ops: Object[]): void;`, where `ops` are the ops committed by other clients between the submitted `op` being submitted and committed

#### `getOps`

```javascript
backend.getOps(agent, index, id, from, to, options, callback);
```

Fetches the ops for a document between the requested version numbers, where the `from` value is inclusive, but the `to` value is non-inclusive.

- `agent` _[`Agent`](#class-agent)_: connection agent to pass to the middleware
- `index` _string_: the name of the target collection or projection
- `id` _string_: the document ID
- `from` _number_: the first op version to fetch. If set to `null`, then ops will be fetched from the earliest version
- `to` _number_: The last op version. This version will _not_ be fetched (ie `to` is non-inclusive). If set to `null`, then ops will be fetched up to the latest version
- `options`: _Object (optional)_: options can be passed directly to the database driver's `getOps` inside the `opsOptions` property: `{opsOptions: {metadata: true}}`
- `callback`: _Function_: a callback with the signature `function (error: Error, ops: Object[]): void;`, where `ops` is an array of the requested ops

#### `getOpsBulk`

```javascript
backend.getOpsBulk(agent, index, fromMap, toMap, options, callback);
```

Fetches the ops for multiple documents in a collection between the requested version numbers, where the `from` value is inclusive, but the `to` value is non-inclusive.

- `agent` _[`Agent`](#class-agent)_: connection agent to pass to the middleware
- `index` _string_: the name of the target collection or projection
- `id` _string_: the document ID
- `fromMap` _Object_: an object whose keys are the IDs of the target documents. The values are the first versions requested of each document. For example, `{abc: 3}` will fetch ops for document with ID `abc` from version `3` (inclusive)
- `toMap` _Object_: an object whose keys are the IDs of the target documents. The values are the last versions requested of each document (non-inclusive). For example, `{abc: 3}` will fetch ops for document with ID `abc` up to version `3` (_not_ inclusive)
- `options`: _Object (optional)_: options can be passed directly to the database driver's `getOpsBulk` inside the `opsOptions` property: `{opsOptions: {metadata: true}}`
- `callback`: _Function_: a callback with the signature `function (error: Error, opsMap: Object): void;`, where `opsMap` is an object whose keys are the IDs of the requested documents, and their values are the arrays of requested ops, eg `{abc: []}`

#### `fetch`

```javascript
backend.fetch(agent, index, id, options, callback);
```

Fetch the current snapshot of a document.

- `agent` _[`Agent`](#class-agent)_: connection agent to pass to the middleware
- `index` _string_: the name of the target collection or projection
- `id` _string_: the document ID
- `options`: _Object (optional)_: options can be passed directly to the database driver's `fetch` inside the `snapshotOptions` property: `{snapshotOptions: {metadata: true}}`
- `callback`: _Function_: a callback with the signature `function (error: Error, snapshot: Snapshot): void;`, where `snapshot` is the requested snapshot

#### `fetchBulk`

```javascript
backend.fetchBulk(agent, index, ids, options, callback);
```

Fetch multiple document snapshots from a collection.

- `agent` _[`Agent`](#class-agent)_: connection agent to pass to the middleware
- `index` _string_: the name of the target collection or projection
- `ids` _string[]_: array of document IDs
- `options`: _Object (optional)_: options can be passed directly to the database driver's `fetchBulk` inside the `snapshotOptions` property: `{snapshotOptions: {metadata: true}}`
- `callback`: _Function_: a callback with the signature `function (error: Error, snapshotMap: Object): void;`, where `snapshotMap` is an object whose keys are the requested IDs, and the values are the requested `Snapshot`s

#### `queryFetch`

```javascript
backend.queryFetch(agent, index, query, options, callback);
```

Fetch snapshots that match the provided query. In most cases, querying the backing database directly should be preferred, but `queryFetch` can be used in order to apply middleware, whilst avoiding the overheads associated with using a `Doc` instance.

- `agent` _[`Agent`](#class-agent)_: connection agent to pass to the middleware
- `index` _string_: the name of the target collection or projection
- `query` _Object_: a query object, whose format will depend on the database adapter being used
- `options` _Object_: an object that may contain a `db` property, which specifies which database to run the query against. These extra databases can be attached via the `extraDbs` option in the `Backend` constructor
- `callback` _Function_: a callback with the signature `function (error: Error, snapshots: Snapshot[], extra: Object): void;`, where `snapshots` is an array of the snapshots matching the query, and `extra` is an (optional) object that the database adapter might return with more information about the results (such as counts)

### Class: `ShareDB.Agent`

An `Agent` is the representation of a client's `Connection` state on the server. If the `Connection` was created through `backend.connect` (ie the client is running on the server), then the `Agent` associated with a `Connection` can be accessed through a direct reference: `connection.agent`.

The `Agent` will be made available in all [middleware](#middlewares) requests. The `agent.custom` field is an object that can be used for storing arbitrary information for use in middleware. For example:

```javascript
backend.use('connect', (request, callback) => {
  // Best practice to clone to prevent mutating the object after connection.
  // You may also want to consider a deep clone, depending on the shape of request.req.
  Object.assign(request.agent.custom, request.req);
  callback();
});

backend.use('readSnapshots', (request, callback) => {
  const connectionInfo = request.agent.custom;
  const snapshots = request.snapshots;

  // Use the information provided at connection to determine if a user can access the snapshots.
  // This should also be checked when fetching and submitting ops.
  if (!userCanAccessCollection(connectionInfo, request.collection)) {
    return callback(new Error('Not allowed to access collection ' + request.collection));
  }
  // Check each snapshot individually.
  for (const snapshot of snapshots) {
    if (!userCanAccessSnapshot(connectionInfo, request.collection, snapshot)) {
      request.rejectSnapshotRead(snapshot,
        new Error('Not allowed to access snapshot in ' request.collection));
    }
  }

  callback();
});

// Here you should determine what permissions a user has, probably by reading a cookie and
// potentially making some database request to check which documents they can access, or which
// roles they have, etc. If doing this asynchronously, make sure you call backend.connect
// after the permissions have been fetched.
const connectionInfo = getUserPermissions();
// Pass info in as the second argument. This will be made available as request.req in the
// 'connection' middleware.
const connection = backend.connect(null, connectionInfo);
```

### Class: `ShareDB.Presence`

Representation of the presence data associated with a given channel.

#### `subscribe`

```javascript
presence.subscribe(callback): void;
```

Subscribe to presence updates from other clients. Note that presence can be submitted without subscribing, but remote clients will not be able to re-request presence from you if you are not subscribed.

- `callback` _Function_: a callback with the signature `function (error: Error): void;`

#### `unsubscribe`

```javascript
presence.unsubscribe(callback): void;
```

Unsubscribe from presence updates from remote clients.

- `callback` _Function_: a callback with the signature `function (error: Error): void;`

#### `on`

```javascript
presence.on('receive', callback): void;
```

An update from a remote presence client has been received.

- `callback` _Function_: callback for handling the received presence: `function (presenceId, presenceValue): void;`

```javascript
presence.on('error', callback): void;
```

A presence-related error has occurred.

- `callback` _Function_: a callback with the signature `function (error: Error): void;`

#### `create`

```javascript
presence.create(presenceId): LocalPresence;
```

Create an instance of [`LocalPresence`](#class-sharedblocalpresence), which can be used to represent local presence. Many or none such local presences may exist on a `Presence` instance.

- `presenceId` _string (optional)_: a unique ID representing the local presence. Remember - depending on use-case - the same client might have multiple presences, so this might not necessarily be a user or client ID. If one is not provided, a random ID will be assigned for you.

#### `destroy`

```javascript
presence.destroy(callback);
```

Updates all remote clients with a `null` presence, and removes it from the `Connection` cache, so that it can be garbage-collected. This should be called when you are done with a presence, and no longer need to use it to fire updates.

- `callback` _Function_: a callback with the signature `function (error: Error): void;`

### Class: `ShareDB.DocPresence`

Specialised case of [`Presence`](#class-sharedbpresence), which is tied to a specific [`Doc`](#class-sharedbdoc). When using presence with an associated `Doc`, any ops applied to the `Doc` will automatically be used to transform associated presence. On destroy, the `DocPresence` will unregister its listeners from the `Doc`.

See [`Presence`](#class-sharedbpresence) for available methods.

### Class: `ShareDB.LocalPresence`

`LocalPresence` represents the presence of the local client in a given `Doc`. For example, this might be the position of a caret in a text document; which field has been highlighted in a complex JSON object; etc. Multiple presences may exist per `Doc` even on the same client.

#### `submit`

```javascript
localPresence.submit(presence, callback): void;
```

Update the local representation of presence, and broadcast that presence to any other document presence subscribers.

- `presence` _Object_: the presence object to broadcast. The structure of this will depend on the OT type
- `callback` _Function_: a callback with the signature `function (error: Error): void;`

#### `send`

```javascript
localPresence.send(callback): void;
```

Send presence like `submit`, but without updating the value. Can be useful if local presences expire periodically.

- `callback` _Function_: a callback with the signature `function (error: Error): void;`

#### `destroy`

```javascript
localPresence.destroy(callback): void;
```

Informs all remote clients that this presence is now `null`, and deletes itself for garbage collection.

- `callback` _Function_: a callback with the signature `function (error: Error): void;`

### Logging

By default, ShareDB logs to `console`. This can be overridden if you wish to silence logs, or to log to your own logging driver or alert service.

Methods can be overridden by passing a [`console`-like object](https://developer.mozilla.org/en-US/docs/Web/API/console) to `logger.setMethods`

```javascript
var ShareDB = require('sharedb/lib/client');
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
