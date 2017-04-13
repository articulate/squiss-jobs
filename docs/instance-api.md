# Instance API

- [queue.handle](#queuehandle)
- [queue.handleMany](#queuehandlemany)
- [queue.on](#queueon)
- [queue.send](#queuesend)
- [queue.start](#queuestart)
- [queue.stop](#queuestop)

## queue.handle

```haskell
(String, (*, Function) -> *) -> Object
```

#### Parameters

- String `type` <br/>
  The job type.
- Function `handler(payload, done)` <br/>
  The handler for that job type.

#### Returns

- Object `queue` <br/>
  The queue instance.

Registers a job handler for a specific job type.  If you register another handler for the same type, it will overwrite the first.

Please note the expected handler signature.  The `payload` will have already been deserialized with `JSON.parse`.  To mark the job as complete, simply call `done()`.  Call `done(err)` with an `Error` to fail the job and leave it on the queue.

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const foo = (payload, done) => {
  console.log(payload)
  done()
}

queue.handle('foo', squiss.domainify(foo))
```

You may also call `queue.handle` multiple times to register several job types.

```js
const jobs = require('require-dir')()

for (var type in jobs) {
  queue.handle(type, squiss.domainify(jobs[type]))
}
```

## queue.handleMany

```haskell
(Object) -> Object
```

#### Parameters

- Object `jobs` <br/>
  A map of job types to handlers

#### Returns

- Object `queue` <br/>
  The queue instance.

Similar to [queue.handle](#queuehandle), but registers multiple jobs in one shot.

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const foo = (payload, done) => {
  console.log(payload)
  done()
}

queue.handleMany('foo', { foo: squiss.domainify(foo) }))
```

You may also call `queue.handleMany` multiple times to register several sets of jobs.

## queue.on

```haskell
(String, Function) -> Object
```

#### Parameters

- String `type` <br/>
  The event type.
- Function `listener` <br/>
  The event listener.

#### Returns

- Object `queue` <br/>
  The queue instance.

Registers event listeners.  This is exactly the [eventemitter.on](http://devdocs.io/node/events#events_emitter_on_eventname_listener) function.  Events of interest are listed in the [sqs-consumer documentation](https://www.npmjs.com/package/sqs-consumer#events).

```js
const squiss = require('./squiss')

const queue = squiss.create({ /* your config */ })

queue.on('error', console.error)
queue.on('processing_error', console.error)
```

## queue.send

```haskell
(String, *) -> Promise
```

#### Parameters

- String `type` <br/>
  The job type.
- Any `payload` <br/>
  The job payload.

#### Returns

- Promise <br/>
  Resolves with the message sent through `sqs-producer`.

Sends a job into the SQS queue.  The `payload` will be serialized with `JSON.stringify`, and a random `id` will be added to the message before sending into the queue.  You can recover from enqueueing errors by calling `.catch()` on the returned promise.

```js
const queue = require('../lib/queue')

queue.send('foo', { bar: 'baz' }).catch(console.error)
```

## queue.start

```haskell
() -> Object
```

#### Parameters

None.

#### Returns

- Object `queue` <br/>
  The queue instance.

Starts pulling jobs off the queuing and processing them one-at-a-time.

```js
const squiss = require('squiss-jobs')
const queue  = require('../lib/queue')

const jobs = require('require-dir')()

for (var type in jobs) {
  queue.handle(type, squiss.domainify(jobs[type]))
}

queue.start()
```

## queue.stop

```haskell
() -> Object
```

#### Parameters

None.

#### Returns

- Object `queue` <br/>
  The queue instance.

Stops processing jobs.  Because every `start` needs a `stop`.  You can always start again with `queue.start()`.
