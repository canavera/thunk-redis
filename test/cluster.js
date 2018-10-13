'use strict'

const tman = require('tman')
const assert = require('assert')
const thunk = require('thunks')()
const redis = require('..')
// Server: https://github.com/Grokzen/docker-redis-cluster
const clusterHosts = [
  '127.0.0.1:7000',
  '127.0.0.1:7001',
  '127.0.0.1:7002',
  '127.0.0.1:7003',
  '127.0.0.1:7004',
  '127.0.0.1:7005'
]
const options = {
  IPMap: {
    '172.17.0.2:7000': '127.0.0.1:7000',
    '172.17.0.2:7001': '127.0.0.1:7001',
    '172.17.0.2:7002': '127.0.0.1:7002',
    '172.17.0.2:7003': '127.0.0.1:7003',
    '172.17.0.2:7004': '127.0.0.1:7004',
    '172.17.0.2:7005': '127.0.0.1:7005'
  }
}

const client = redis.createClient(clusterHosts, options)
const count = 10000

client.on('error', function (err) {
  console.log(JSON.stringify(err))
})

tman.before(function * () {
  console.log(yield client.cluster('slots'))
})

tman.after(function * () {
  yield thunk.delay(1000)
  process.exit()
})

tman.suite('cluster test', function () {
  tman.it('auto find node by "MOVED" and "ASK"', function * () {
    const clusterHosts2 = clusterHosts.slice()
    clusterHosts2.pop() // drop a node
    const client2 = redis.createClient(clusterHosts2, options)
    const task = []
    let len = count
    while (len--) {
      task.push(thunk(len + '')(function * (_, res) {
        assert.strictEqual((yield client2.set(res, res)), 'OK')
        assert.strictEqual((yield client2.get(res)), res)
        if (!(res % 500)) process.stdout.write('.')
      }))
    }
    yield thunk.all(task)
  })

  tman.it('create 10000 keys', function * () {
    const task = []
    let len = count
    while (len--) {
      task.push(thunk(len + '')(function * (_, res) {
        assert.strictEqual((yield client.set(res, res)), 'OK')
        assert.strictEqual((yield client.get(res)), res)
        if (!(res % 500)) process.stdout.write('.')
      }))
    }
    yield thunk.all(task)
  })

  tman.it('get 10000 keys', function * () {
    const task = []
    let len = count
    while (len--) {
      task.push(thunk(len + '')(function * (_, res) {
        assert.strictEqual((yield client.get(res)), res)
        if (!(res % 500)) process.stdout.write('.')
      }))
    }
    yield thunk.all(task)
  })

  tman.it.skip('transaction', function * () {
    for (let i = 0; i < count; i++) {
      const res = yield [
        client.multi(),
        client.set(i, i),
        client.get(i),
        client.exec()
      ]
      console.log(111, res)
      assert.strictEqual(res[0], 'OK')
      assert.strictEqual(res[1], 'QUEUED')
      assert.strictEqual(res[2], 'QUEUED')
      assert.strictEqual(res[3][0], 'OK')
      assert.strictEqual(res[3][1], i + '')
      if (!(i % 500)) process.stdout.write('.')
    }
  })

  tman.it('evalauto', function * () {
    const task = []
    let len = count
    while (len--) addTask(len)
    yield thunk.all(task)

    function addTask (index) {
      task.push(function * () {
        const res = yield client.evalauto('return KEYS[1]', 1, index)
        assert.strictEqual(+res, index)
        if (!(index % 500)) process.stdout.write('.')
        return +res
      })
    }
  })

  tman.it.skip('kill a master', function * () {
    const task = []
    const result = {}
    let len = 10000

    client.on('warn', function (err) {
      console.log(err)
    })

    thunk.delay(100)(function () {
      // kill the default master node
      client.debug('segfault')()
    })

    while (len--) {
      task.push(thunk(len + '')(function * (_, res) {
        return yield client.get(res)
      })(function (err, res) {
        assert.strictEqual(err, null)
        result[res] = true
        if (!(res % 500)) process.stdout.write('.')
      }))
      yield thunk.delay(5)
    }
    yield thunk.all(task)
    len = 10000
    while (len--) assert.strictEqual(result[len], true)
  })
})
