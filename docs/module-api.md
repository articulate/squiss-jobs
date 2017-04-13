# Module API

- [squiss.create](#squisscreate)
- [squiss.domainify](#squissdomainify)

## squiss.create

```haskell
Object -> Object
```

#### Parameters

- Object `{ queueUrl, region, ... }` <br/>
  Options object.  `queueUrl` is your SQS job queue.  `region` defaults to `eu-west-1`.  Other options are listed [here](https://www.npmjs.com/package/sqs-consumer#options).

#### Returns

- Object `queue` <br/>
  A queue instance.  See [Instance API](#instance-api).

Creates a job queue instance.  Note that `squiss-jobs` supplies its own `handleMessage` function to `sqs-consumer`, so any that you provide will be overridden.  Also, I recommend creating this once with your config and exporting it as a singleton.

```js
const squiss = require('squiss-jobs')

const queue = squiss.create({
  queueUrl: process.env.JOBS_URI,
  region:   process.env.AWS_REGION
})

module.exports = queue
```

## squiss.domainify

```haskell
((*, Function) -> *) -> (*, Function) -> *
```

#### Parameters

- Function `handler(payload, done)` <br/>
  The job handler to wrap in a [domain](http://devdocs.io/node/domain#domain_class_domain).

#### Returns

- Function `wrappedHandler(payload, done)` <br/>
  The wrapped job handler.

Avoids uncaught exceptions in async jobs by wrapping the job handler in a [domain](http://devdocs.io/node/domain#domain_class_domain).  The expected handler signature is the same as expected by [queue.handle]().

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const foo = (payload, done) => {
  console.log(payload)
  done()
}

queue.handle('foo', squiss.domainify(foo))
```
