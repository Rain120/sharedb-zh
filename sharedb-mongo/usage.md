---
order: 2
---

## Usage

`sharedb-mongo` uses the [MongoDB NodeJS Driver](https://github.com/mongodb/node-mongodb-native), and it supports the same configuration options.

There are two ways to instantiate a sharedb-mongo wrapper:

1.  The simplest way is to invoke the module and pass in your mongo DB
    arguments as arguments to the module function. For example:

        ```javascript
        const db = require('sharedb-mongo')('mongodb://localhost:27017/test', {mongoOptions: {...}});
        const backend = new ShareDB({db});
        ```

2.  If you'd like to reuse a mongo db connection or handle mongo driver
    instantiation yourself, you can pass in a function that calls back with
    a mongo instance.

        ```javascript
        const mongodb = require('mongodb');
        const db = require('sharedb-mongo')({mongo: function(callback) {
          mongodb.connect('mongodb://localhost:27017/test', callback);
        }});
        const backend = new ShareDB({db});
        ```
