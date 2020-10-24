---
order: 4
---

## 异常

`ShareDB`以**`ShareDBError`实例**的形式返回错误，其中包含机器可解析的代码，以及大家可辨识等更多细节的消息。

### 常见的异常代码

#### `ERR_OP_SUBMIT_REJECTED`

客户端提交的`op`操作已因非关键原因而被服务器拒绝。

当客户端收到此代码时，它将尝试回滚被拒绝的`op`操作，从而使客户端保持可用状态。

此错误可用作标准控制流的一部分。 例如，消费者可以定义一个中间件，该中间件使用该错误代码将客户端重置为有效状态，从而验证文档结构并拒绝不符合该架构的操作。

#### `ERR_OP_ALREADY_SUBMITTED`

同一`op`被服务器接收了两次.

这是非关键操作，是正常控制流程的一部分，并作为错误发送，以使`op`处理短路。 最终它被服务器吞没，不需要进一步处理.

#### `ERR_SUBMIT_TRANSFORM_OPS_NOT_FOUND`

无法找到将提交的 `op` 转换为快照的当前版本所需的 `ops` 。

如果文档的旧版本上的客户机提交了一个`op`, 那么该`op`需要同时被应用到文档的所有 `ops` 转换。如果服务器无法从数据库中获取这些操作, 则返回此错误。

最常见的情况是将 `ops` 从数据库中删除。例如, 假设我们在数据库中 的`ops` 上设置了`TTL`。我们还假设我们有一个客户机, 它太老了, 以至于`TTL`策略删除了与其版本对应的`op`。如果这个客户端然后尝试提交一个`op`, 服务器将无法找到转换 `op` 以应用到快照的当前版本所需的 `ops` 。

造成此错误的其他原因可能是将 ops 集合全部删除, 或者以其他方式损坏了数据库。

#### `ERR_MAX_SUBMIT_RETRIES_EXCEEDED`

一次提交超过了 `maxSubmitRetries` 选项定义的重试次数。

#### `ERR_DOC_ALREADY_CREATED`

创建请求失败, 因为文档已经由另一个客户机创建。

当两个客户机碰巧同时尝试创建相同的文档时, 可能会发生这种情况, 并且只要获取已经创建的文档就可以恢复。

#### `ERR_DOC_WAS_DELETED`

删除请求失败, 因为文档已经被另一个客户端删除了。

当两个客户机碰巧同时尝试删除同一文档时, 就会发生这种情况。由于最终结果是相同的, 因此可以忽略此错误。

#### `ERR_DOC_TYPE_NOT_RECOGNIZED`

指定的文档类型没有在 `ShareDB` 中注册。

通常可以通过记住注册所需的任何类型来纠正此错误:

```javascript
var ShareDB = require('sharedb');
var richText = require('rich-text');

ShareDB.types.register(richText.type);
```

#### `ERR_DEFAULT_TYPE_MISMATCH`

客户端使用的默认类型与服务器期望的默认类型不匹配。

这通常只会发生在`ShareDB` 默认使用的内置 `json0` 的默认类型不同的情况下(例如, 如果使用一个 `fork`)。客户端和服务器必须使用完全相同的类型, 并且应该注册为默认类型:

```javascript
var ShareDB = require('sharedb');
var forkedJson0 = require('forked-json0');

// 确保在您的客户端也这样做
ShareDB.types.defaultType = forkedJson0.type;
```

#### `ERR_OP_NOT_ALLOWED_IN_PROJECTION`

当应用于映射时, 提交的 `op` 无效。

如果 `op` 的目标是不包含在映射中的某些属性, 就可能发生这种情况。

#### `ERR_TYPE_CANNOT_BE_PROJECTED`

不能映射文档的类型。`json0` 是目前唯一支持映射的类型。
