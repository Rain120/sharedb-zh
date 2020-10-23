---
order: 3
---

## Queries

In ShareDB, queries are represented as single JavaScript objects. But
Mongo exposes methods on collections and cursors such as `mapReduce`,
`sort` or `count`. These are encoded into ShareDBMongo's query object
format through special `$`-prefixed keys that are interpreted and
stripped out of the query before being passed into Mongo's `find`
method.

Here are some examples:

| MongoDB query code                                   | ShareDBMongo query object                           |
| ---------------------------------------------------- | --------------------------------------------------- |
| `coll.find({x: 1, y: {$ne: 2}})`                     | `{x: 1, y: {$ne: 2}}`                               |
| `coll.find({$or: [{x: 1}, {y: 1}])`                  | `{$or: [{x: 1}, {y: 1}]}}`                          |
| `coll.mapReduce({map: ..., reduce: ...})`            | `{$mapReduce: {map: ..., reduce: ...}`              |
| `coll.find({x: 1}).sort({y: -1})`                    | `{x: 1, $sort: {y: -1}}`                            |
| `coll.find().limit(5).count({applySkipLimit: true})` | `{x: 1, $limit: 5, $count: {applySkipLimit: true}}` |

Most of Mongo 3.2's
[collection](https://docs.mongodb.com/manual/reference/method/js-collection/)
and
[cursor](https://docs.mongodb.com/manual/reference/method/js-cursor/)
methods are supported. Methods calls map to query properties whose key
is the method name prefixed by `$` and value is the argument passed to
the method. `$readPref` is an exception -- it takes an object with
`mode` and `tagSet` fields which map to the two arguments passed into
the `readPref` method.

For a full list of supported collection and cursor methods, see
`collectionOperationsMap`, `cursorTransformsMap` and
`cursorOperationsMap` in index.js
