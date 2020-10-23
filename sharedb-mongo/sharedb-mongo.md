---
order: 1
---

# Sharedb Mongo

[![NPM Version](https://img.shields.io/npm/v/sharedb-mongo.svg)](https://npmjs.org/package/sharedb-mongo)
[![Build Status](https://travis-ci.org/share/sharedb-mongo.svg?branch=master)](https://travis-ci.org/share/sharedb-mongo)
[![Coverage Status](https://coveralls.io/repos/github/share/sharedb-mongo/badge.svg?branch=master)](https://coveralls.io/github/share/sharedb-mongo?branch=master)

MongoDB database adapter for [sharedb](https://github.com/share/sharedb). This
driver can be used both as a snapshot store and oplog.

Snapshots are stored where you'd expect (the named collection with \_id=id). In
addition, operations are stored in `o_COLLECTION`. For example, if you have
a `users` collection, the operations are stored in `o_users`.

JSON document snapshots in sharedb-mongo are unwrapped so you can use mongo
queries directly against JSON documents. (They just have some extra fields in
the form of `_v` and `_type`). It is safe to query documents directly with the
MongoDB driver or command line. Any read only mongo features, including find,
aggregate, and map reduce are safe to perform concurrent with ShareDB.

However, you must _always_ use ShareDB to edit documents. Never use the
MongoDB driver or command line to directly modify any documents that ShareDB
might create or edit. ShareDB must be used to properly persist operations
together with snapshots.

## MIT License

Copyright (c) 2015 by Joseph Gentle and Nate Smith

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
