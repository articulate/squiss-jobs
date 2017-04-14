# squiss-jobs [![npm version](https://img.shields.io/npm/v/squiss-jobs.svg)](https://www.npmjs.com/package/squiss-jobs) [![npm version](https://img.shields.io/npm/dm/squiss-jobs.svg)](https://www.npmjs.com/package/squiss-jobs)

SQS-backed job queue.

## Quick start guide

```js
// instantiate your queue
const queue = require('squiss-jobs')({
  queueUrl: process.env.JOBS_URI,
  region:   process.env.AWS_REGION
})

// create a job handler
const foo = payload =>
  Promise.resolve(payload)
    .then(/* do something useful */)

// register the job
queue.handle('foo', foo)

// start processing jobs
queue.start()

// send a job onto the queue
queue.send('foo', { bar: 'baz' })
```

## v1 docs

- [API docs](https://github.com/articulate/squiss-jobs/blob/master/docs/api.md)
- [CLI docs](https://github.com/articulate/squiss-jobs/blob/master/docs/cli.md)

For `v0` docs, see the [original API](https://github.com/articulate/squiss-jobs/blob/f9690a36b4eafd962516236af9e1709efaa00e71/README.md).
