const Consumer = require('sqs-consumer')
const Producer = require('sqs-producer')

const { compose } = require('ramda')
const { parse, stringify } = JSON

exports.create = ({ queueUrl }) => {
  const handlers = {},
        handleMessage = parseFirst(handleWith(handlers)),
        consumer = Consumer.create({ handleMessage, queueUrl }),
        producer = Producer.create({ queueUrl })

  const deliver = msg => new Promise((res, rej) =>
    producer.send([stringify(msg)], err => err ? rej(err) : res(msg)))

  const handle = (type, handler) =>
    handlers[type] = handler

  const on    = consumer.on.bind(consumer)
  const send  = compose(deliver, message)
  const start = consumer.start.bind(consumer)
  const stop  = consumer.stop.bind(consumer)

  return { handle, on, send, start, stop }
}

exports.domainify = fn => (payload, done) => {
  const d = require('domain').create()
  d.on('error', done)
  d.run(fn, payload, done)
}

const handleWith = handlers => ({ type, payload }, done) =>
  typeof handlers[type] === 'function' && handlers[type](payload, done)

const message = (type, payload) => ({ type, payload })

const parseFirst = fn => (msg, done) => fn(parse(msg.Body), done)
