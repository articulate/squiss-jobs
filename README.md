# squiss-jobs [![npm version](https://img.shields.io/npm/v/@articulate/squiss-jobs.svg)](https://www.npmjs.com/package/@articulate/squiss-jobs)

SQS-backed job queue.

- [Module API](#module-api)
- [Instance API](#instance-api)
- [CLI](#cli)

## Module API

- [squiss.create](#squisscreate)
- [squiss.domainify](#squissdomainify)

## squiss.create

```haskell
:: Object -> Object
```

#### Parameters

- Object `{ queueUrl, region, ... }` <br/>
  Options object.  `queueUrl` is your SQS job queue.  `region` defaults to `eu-west-1`.  Other options are listed [here](https://www.npmjs.com/package/sqs-consumer#options).

#### Returns

- Object `queue` <br/>
  A queue instance.  See [Instance API](#instance-api).

Creates a job queue instance.  Note that `squiss-jobs` supplies its own `handleMessage` function to `sqs-consumer`, so any that you provide will be overridden.  Also, I recommend creating this once with your config and exporting it as a singleton.

```js
const squiss = require('squiss')

const queue = squiss.create({
  queueUrl: process.env.JOBS_URI,
  region:   process.env.AWS_REGION
})

module.exports = queue
```

## squiss.domainify

```haskell
:: ((*, Function) -> *) -> (*, Function) -> *
```

#### Parameters

- Function `handler(payload, done)` <br/>
  The job handler to wrap in a [domain](http://devdocs.io/node/domain#domain_class_domain).

#### Returns

- Function `wrappedHandler(payload, done)` <br/>
  The wrapped job handler.

Avoids uncaught exceptions in async jobs by wrapping the job handler in a [domain](http://devdocs.io/node/domain#domain_class_domain).  The expected handler signature is the same as expected by [queue.handle]().

```js
const squiss = require('squiss')
const queue  = require('../lib/queue')

const foo = (payload, done) => {
  console.log(payload)
  done()
}

queue.handle('foo', squiss.domainify(foo))
```

## Instance API

- [queue.handle](#queuehandle)
- [queue.on](#queueon)
- [queue.send](#queuesend)
- [queue.start](#queuestart)
- [queue.stop](#queuestop)

## queue.handle

```haskell
:: (String, (*, Function) -> *) -> Object
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
const squiss = require('squiss')
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

## queue.on

```haskell
:: (String, Function) -> Object
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
:: (String, *) -> Promise
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
:: () -> Object
```

#### Parameters

None.

#### Returns

- Object `queue` <br/>
  The queue instance.

Starts pulling jobs off the queuing and processing them one-at-a-time.

```js
const squiss = require('squiss')
const queue  = require('../lib/queue')

const jobs = require('require-dir')()

for (var type in jobs) {
  queue.handle(type, squiss.domainify(jobs[type]))
}

queue.start()
```

## queue.stop

```haskell
:: () -> Object
```

#### Parameters

None.

#### Returns

- Object `queue` <br/>
  The queue instance.

Stops processing jobs.  Because every `start` needs a `stop`.  You can always start again with `queue.start()`.

## CLI

`squiss-jobs` ships with an executable script of the same name to help you create a personal dev job queue in SQS.  The queue name will be `${project-dirname}-jobs-${aws-username}`, and will have a `RedrivePolicy` pushing to a [deadletter queue](http://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/SQSDeadLetterQueue.html) after 3 job failures.

To run the script, you can either install globally with `npm i -g squiss-jobs`, or install normally and include it in your `npm` scripts in the `package.json`.  After creating your queues, it will output the job queue URL for you to include in your ENV.

```sh
scotts-air:squiss-jobs scott$ squiss-jobs

Copy the following into your .env file:
JOBS_URI=https://queue.amazonaws.com/689543204258/squiss-jobs-jobs-smccormack
```

**Note:** The CLI only supports Mac OSX, and requires `brew`.  It will `brew install` both `jq` and `awscli` if not present, and then allow you to configure your AWS creds before continuing.
