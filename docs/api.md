# API docs

| Function | Signature |
| -------- | --------- |
| [squiss](#squiss) | `{ k: v } -> Queue` |
| [queue.handle](#queuehandle) | `String -> (a -> Promise) -> Queue` |
| [queue.handleMany](#queuehandlemany) | `{ k: (a -> Promise) } -> Queue` |
| [queue.on](#queueon) | `String -> Function -> Queue` |
| [queue.send](#queuesend) | `String -> a -> Promise` |
| [queue.start](#queuestart) | `() -> Queue` |
| [queue.stop](#queuestop) | `() -> Queue` |

### squiss

```haskell
{ k: v } -> Queue
```

Accepts an options object and returns a job queue instance.  We recommend creating this once with your config and exporting it as a singleton.

**Available options:**

| Name | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `queueUrl` | `String` | | the SQS job queue url |
| `region` | `String` | `eu-west-1` | the AWS region |
| `timeoutLogger` | `Function` | | optional notifier for visibility timeouts |
| `visibilityTimeout` | `Number` | `30` | message visibility time in seconds |

Other options are listed [here](https://www.npmjs.com/package/sqs-consumer#options).  Note that `squiss-jobs` supplies its own `handleMessage` function to `sqs-consumer`, so any that you provide will be overridden.

```js
module.exports = require('squiss-jobs')({
  queueUrl: process.env.JOBS_URI,
  region:   process.env.AWS_REGION
})
```

### queue.handle

```haskell
String -> (a -> Promise) -> Queue
```

Registers a job handler function for a specific job type.  If you register another handler for the same type, it will override the first.  Returns the queue instance.

The handler will be passed a `payload` that has already been deserialized with `JSON.parse`.  If the handler returns a `Promise`, the job will be marked as completed when it resolves, or marked as failed when it is rejected.

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const foo = payload =>
  Promise.resolve(payload)
    .then(/* do something useful */)

queue.handle('foo', foo)
```

You may also call `queue.handle` multiple times to register several job types.

```js
const jobs = require('require-dir')()

for (var type in jobs) {
  queue.handle(type, jobs[type])
}
```

### queue.handleMany

```haskell
{ k: (a -> Promise) } -> Queue
```

Similar to [queue.handle](#queuehandle), but registers multiple jobs in one shot.  Returns the queue instance.

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const foo = payload =>
  Promise.resolve(payload)
    .then(/* do something useful */)

const bar = payload =>
  Promise.resolve(payload)
    .then(/* do something else */)

queue.handleMany({ foo, bar }))
```

You may also call `queue.handleMany` multiple times to register several sets of jobs.

### queue.on

```haskell
String -> Function -> Queue
```

Registers event listeners.  This is exactly the [eventemitter.on](http://devdocs.io/node/events#events_emitter_on_eventname_listener) function, but curried.  Events of interest are listed in the [sqs-consumer documentation](https://www.npmjs.com/package/sqs-consumer#events).  Returns the queue instance.

```js
const squiss = require('squiss-jobs')

const queue = squiss.create({ /* your config */ })

queue.on('error', console.error)
queue.on('processing_error', console.error)
```

### queue.send

```haskell
String -> a -> Promise
```

Sends a job with `type` and `payload` onto the SQS queue.  The `payload` will be serialized with `JSON.stringify`, and a random `id` will be added to the message before sending into the queue.  Returns a `Promise` that resolves with the message sent through `sqs-producer`.

```js
const queue = require('../lib/queue')

queue.send('foo', { bar: 'baz' }).catch(console.error)
```

### queue.start

```haskell
() -> Queue
```

Starts pulling jobs off the queuing and processing them one-at-a-time.  Returns the queue instance.

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const jobs = require('require-dir')()

for (var type in jobs) {
  queue.handle(type, jobs[type])
}

queue.start()
```

### queue.stop

```haskell
() -> Queue
```

Stops processing jobs.  Because every `start` needs a `stop`.  You can always start again with `queue.start()`.  Returns the queue instance.
