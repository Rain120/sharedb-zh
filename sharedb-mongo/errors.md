---
order: 5
---

## Error codes

Mongo errors are passed back directly. Additional error codes:

#### 4100 -- Bad request - DB

- 4101 -- Invalid op version
- 4102 -- Invalid collection name
- 4103 -- \$where queries disabled
- 4104 -- \$mapReduce queries disabled
- 4105 -- \$aggregate queries disabled
- 4106 -- \$query property deprecated in queries
- 4107 -- Malformed query operator
- 4108 -- Only one collection operation allowed
- 4109 -- Only one cursor operation allowed
- 4110 -- Cursor methods can't run after collection method

#### 5100 -- Internal error - DB

- 5101 -- Already closed
- 5102 -- Snapshot missing last operation field
- 5103 -- Missing ops from requested version
- 5104 -- Failed to parse query
