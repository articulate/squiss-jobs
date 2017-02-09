const Consumer = require('sqs-consumer')
const idgen    = require('idgen')
const Producer = require('sqs-producer')
const debug    = require('debug')('squiss-jobs')

const { always, compose, dissoc, merge, partial } = require('ramda')
const { parse, stringify } = JSON

const defaults = {
  visibilityTimeout: 30, // in seconds, SQS default
}

exports.create = opts => {
  const logger = opts.logger || debug,
        options = compose(merge(defaults), dissoc('logger'))(opts),
        handlers = {}

  const wrapWithTimeoutLogger = (fn, details) => (payload, done) => {
    const logTimeoutExceeded = () => logger(merge(details, { error: 'visibility timeout exceeded' })),
          timeout = setTimeout(logTimeoutExceeded, options.visibilityTimeout * 1000),
          finish = compose(partial(clearTimeout, [timeout]), done)
    fn(payload, finish)
  }

  const handleWith = ({ type, payload }, done) => {
    const handler = typeof handlers[type] === 'function'
      ? handlers[type]
      : (payload, done) => done(new Error(`No Handler registered for (${type})`))
    const wrappedHandler = wrapWithTimeoutLogger(handler, merge(options, { type, payload }))
    wrappedHandler(payload, done)
  }

  const handleMessage = parseFirst(handleWith),
        consumer = Consumer.create(merge(options, { handleMessage })),
        producer = Producer.create(options),
        queue    = {}

  const dispatch = action => new Promise((res, rej) => {
    const message = { id: idgen(), body: stringify(action) }
    producer.send([message], err => err ? rej(err) : res(message))
  })

  const handle = (type, handler) => handlers[type] = handler
  const handleMany = jobs => Object.assign(handlers, jobs)

  const on    = consumer.on.bind(consumer),
        start = consumer.start.bind(consumer),
        stop  = consumer.stop.bind(consumer)

  queue.handle     = compose(always(queue), handle)
  queue.handleMany = compose(always(queue), handleMany)
  queue.on         = compose(always(queue), on)
  queue.send       = compose(dispatch, action)
  queue.start      = compose(always(queue), start)
  queue.stop       = compose(always(queue), stop)

  return queue
}

exports.domainify = fn => (payload, done) => {
  const d = require('domain').create()
  d.on('error', done)
  d.run(fn, payload, done)
}

const action = (type, payload) => ({ type, payload })

const parseFirst = fn => (msg, done) => fn(parse(msg.Body), done)
