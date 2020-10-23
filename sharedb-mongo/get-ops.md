---
order: 4
---

## `getOps` without strict linking

There is a `getOpsWithoutStrictLinking` flag, which can be set to
`true` to speed up `getOps` under certain circumstances, but with
potential risks to the integrity of the results. Read below for
more detail.

### Introduction

ShareDB has to deal with concurrency issues. In particular, here we
discuss the issue of submitting multiple competing ops against a
version of a document.

For example, if I have a version of a document at v1, and I
simultaneously submit two ops (from different servers, say) against
this snapshot, then we need to handle the fact that only one of
these ops can be accepted as canonical and applied to the snapshot.

This issue is dealt with through **optimistic locking**. Even if
you are only asking for a subset of the ops, under the default
behaviour, `getOps` will fetch **all** the ops up to the current
version.

### Optimistic locking and linked ops

`sharedb-mongo` deals with its concurrency issue with multiple op
submissions with optimistic locking. Here's an example of its
behaviour:

- my doc exists at v1
- two simultaneous v1 ops are submitted to ShareDB
- both ops are committed to the database
- one op is applied to the snapshot, and the updated snapshot is
  written to the database
- the second op finds that its updated snapshot conflicts with
  the committed snapshot, and the snapshot is rejected, but the
  committed op **remains in the database**

In reality, `sharedb-mongo` attempts to clean up this failed op,
but there's still the small chance that the server crashes
before it can do so, meaning that we may have multiple ops
lingering in the database with the same version.

Because some non-canonical ops may exist in the database, we
cannot just perform a naive fetch of all the ops associated with
a document, because it may return multiple ops with the same
version (where one was successfully applied, and one was not).

In order to return a valid set of canonical ops, the optimistic
locking has a notion of **linked ops**. That is, each op will
point back to the op that it built on top of, and ultimately
the current snapshot points to the op that committed it to the
database.

Because of this, we can work backwards from the current snapshot,
following the trail of op links all the way back to get a chain
of canonical, valid, linked ops. This way, even if a spurious
op exists in the database, no other op will point to it, and it
will be correctly ignored.

This approach has a big down-side: it forces us to fetch all the
ops up to the current version. This might be fine if you want
all ops, or are fetching very recent ops, but can have a large
impact on performance if you only want ops 1-10 of a 10,000
op document, because you actually have to fetch all the ops.

### Dropping strict linking

In order to speed up the performance of `getOps`, you can set
`getOpsWithoutStrictLinking: true`. This will attempt to fetch
the bare minimum ops, whilst still trying to maintain op
integrity.

The assumption that underpins this approach is that any op
that exists with a unique combination of `d` (document ID)
and `v` (version), **is a valid op**. In other words, it
had no conflicts and can be considered canonical.

Consider a document with some ops, including some spurious,
failed ops:

- v1: unique
- v2: unique
- v3: collision 3
- v3: collision 3
- v4: collision 4
- v4: collision 4
- v5: unique
- v6: unique
  ...
- v1000: unique

If I want to fetch ops v1-v3, then we:

- look up v4
- find that v4 is not unique
- look up v5
- see that v5 is unique and therefore assumed valid
- look backwards from v5 for a chain of valid ops, avoiding
  the spurious commits for v4 and v3.
- This way we don't need to fetch all the ops from v5 to the
  current version.

In the case where a valid op cannot be determined, we still
fall back to fetching all ops and working backwards from the
current version.

### Limitations

#### Integrity

Attempting to infer a canonical op can be dangerous compared
to simply following the valid op chain from the snapshot,
which is - by definition - canonical.

This alternative behaviour should be safe, but should be used
with caution, because we are attempting to _infer_ a canonical
op, which may have unforeseen corner cases that return an
**invalid set of ops**.

This may be especially true if the ops are modified outside
of `sharedb-mongo` (eg by setting a TTL, or manually updating
them).

#### Recent ops

There are cases where this flag may slow down behaviour. In
the case of attempting to fetch very recent ops, setting this
flag may make extra database round-trips where fetching the
snapshot would have been faster.

#### `getOpsBulk` and `getOpsToSnapshot`

This flag **only** applies to `getOps`, and **not** to the
similar `getOpsBulk` and `getOpsToSnapshot` methods, whose
performance will remain unchanged.
