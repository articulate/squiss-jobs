const Consumer = require('sqs-consumer')
const idgen    = require('idgen')
const Producer = require('sqs-producer')
const Promise  = require('bluebird')
const { nAry } = require('ramda')

const { always, compose, merge } = require('ramda')
const { parse, stringify } = JSON

Promise.config({ cancellation: true })

exports.create = options => {
  console.log('OPTIONS: ', options)
  const handlers = {},
        handleMessage = parseFirst(handleWith(handlers, options.visibilityTimeout)),
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

//exports.domainify = fn => (payload, done) => {
  //const d = require('domain').create()
  //d.on('error', done)
  //d.run(fn, payload, done)
//}

const action = (type, payload) => ({ type, payload })

//const wrapWithTimeout = (fn, timeout) => payload => fn(payload).timeout(timeout, `Squiss-Jobs: Consumer job timmed out after ${timeout}`)

//const handleWith = (handlers, timeout=30000) => ({ type, payload }, done) => {
  //if (typeof handlers[type] === 'function') {
    ////return Promise.resolve(handlers[type](payload))
    //return Promise.resolve(payload)
      //.then(wrapWithTimeout(handlers[type], timeout))
      ////.then((v) => {
        ////handlers[type](v)
          ////.timeout(timeout, `Squiss-Jobs: Consumer job timmed out after ${timeout}`)
      ////})
      //.then((v)=>{console.log('END: ', v); return v;})
      //.then(nAry(0, done))
      ////.catch(Promise.TimeoutError, (err) => {console.log('cancelling maybe'); throw err})
      //.catch(done)
  //} else {
    //return done(new Error(`No Handler registered for (${type})`))
  //}
//}

const handleWith = (handlers) => ({ type, payload }, done) => {
  if (typeof handlers[type] === 'function') {
    return Promise.resolve(payload)
      .then(handlers[type])
      .then(nAry(0, done))
      .catch(done)
  } else {
    return done(new Error(`No Handler registered for (${type})`))
  }
}

const parseFirst = fn => (msg, done) => fn(parse(msg.Body), done)
