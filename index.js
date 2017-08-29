const Consumer = require('sqs-consumer')
const Producer = require('sqs-producer')
const tinygen  = require('tinygen')

const { always, bind, compose, curryN, dissoc, identity, is,
        merge, mergeAll, nAry, once, partial, tap, when } = require('ramda')

const { parse, stringify } = JSON

const defaults   = { visibilityTimeout: 30 },
      timeoutErr = { error: 'visibility timeout exceeded' }

const action = (type, payload) => ({ type, payload })

const clean = compose(merge(defaults), dissoc('timeoutLogger'))

const missing = type => () =>
  Promise.reject(new Error(`No handler registered for (${type})`))

const parseFirst = fn => (msg, done) =>
  fn(parse(msg.Body), done)

module.exports = opts => {
  const { timeoutLogger=identity, visibilityTimeout } = opts,
        options  = clean(opts),
        handlers = {}

  const dispatch = action =>
    new Promise((res, rej) => {
      const message = { id: tinygen(), body: stringify(action) }
      producer.send([message], err => err ? rej(err) : res(message))
    })

  const handle = (type, handler) =>
    handlers[type] = handler

  const handleMany = jobs =>
    Object.assign(handlers, jobs)

  const handlerFor = type =>
    typeof handlers[type] === 'function' ? handlers[type] : missing(type)

  const processJob = ({ type, payload }, callback) => {
    const done = once(callback)

    const addErrorContext = error => {
      error.params = mergeAll([ options, { type, payload }, timeoutErr ])
      error.component = 'squiss-jobs'
      return error
    }

    const complete = error => {
      const doneError = compose(done, when(is(Error), addErrorContext))
      return arguments.length === 0
        ? done()
        : doneError(error)
    }

    const handleTimeout = () => {
      const error = new Error(timeoutErr.error)
      addErrorContext(error)
      timeoutLogger(params)
      complete(error)
    }

    const timeout = setTimeout(handleTimeout, visibilityTimeout * 1000),
          finish  = compose(tap(partial(clearTimeout, [ timeout ])), complete)

    return Promise.resolve(payload)
      .then(handlerFor(type))
      .then(nAry(0, finish))
      .catch(finish)
  }

  const handleMessage = parseFirst(processJob)

  const consumer = Consumer.create(merge(options, { handleMessage })),
        producer = Producer.create(options),
        queue    = {}

  const on    = bind(consumer.on,    consumer),
        start = bind(consumer.start, consumer),
        stop  = bind(consumer.stop,  consumer)

  queue.handle     = curryN(2, compose(always(queue), handle))
  queue.handleMany = compose(always(queue), handleMany)
  queue.on         = curryN(2, compose(always(queue), on))
  queue.send       = curryN(2, compose(dispatch, action))
  queue.start      = compose(always(queue), start)
  queue.stop       = compose(always(queue), stop)

  return queue
}
