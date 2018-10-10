'use strict'

const tman = require('tman')
const should = require('should')
const redis = require('../..')

tman.suite('commands:Hash', function () {
  let client

  tman.before(function () {
    client = redis.createClient({
      database: 0
    })
    client.on('error', function (error) {
      console.error('redis client:', error)
    })
  })

  tman.beforeEach(function (done) {
    client.flushdb()(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
    })(done)
  })

  tman.after(function () {
    client.clientEnd()
  })

  tman.it('client.hdel, client.hexists', function (done) {
    client.hdel('hash', 'key')(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.hexists('hash', 'key')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.hset('hash', 'key', 123)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hexists('hash', 'key')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hdel('hash', 'key')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hmset('hash', {
        key1: 1,
        key2: 2
      })
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.hdel('hash', 'key1', 'key2', 'key3')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(2)
    })(done)
  })

  tman.it('client.hget, client.hgetall, client.hkeys', function (done) {
    client.hget('hash', 'key')(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(null)
      return this.hgetall('hash')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql({})
      return this.hkeys('hash')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql([])
      return this.hmset('hash', {
        key1: 1,
        key2: 2,
        key3: 3
      })
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.hget('hash', 'key3')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('3')
      return this.hgetall('hash')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql({
        key1: '1',
        key2: '2',
        key3: '3'
      })
      return this.hkeys('hash')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql(['key1', 'key2', 'key3'])
    })(done)
  })

  tman.it('client.hincrby, client.hincrbyfloat', function (done) {
    client.hincrby('hash', 'key', -1)(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(-1)
      return this.hincrby('hash', 'key', -9)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(-10)
      return this.hincrby('hash', 'key', 15)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(5)
      return this.hincrbyfloat('hash', 'key', -1.5)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('3.5')
      return this.hset('hash', 'key1', 'hello')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hincrbyfloat('hash', 'key1', 1)(function (error, res) {
        should(error).be.instanceOf(Error)
      })
    })(done)
  })

  tman.it('client.hlen, client.hmget, client.hmset', function (done) {
    client.hlen('hash')(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.hmget('hash', 'key1', 'key2')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql([null, null])
      return this.hmset('hash', {
        key1: 1,
        key2: 2,
        key3: 3
      })
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.hmget('hash', 'key3', 'key', 'key1')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql(['3', null, '1'])
      return this.hmset('hash', 'key', 0, 'key3', 'hello')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.hlen('hash')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(4)
      return this.hmget('hash', 'key3', 'key')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql(['hello', '0'])
      return this.set('key', 'hello')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return this.hlen('key')(function (error, res) {
        should(error).be.instanceOf(Error)
        return this.hmset('key', 'key3', 'hello')
      })(function (error, res) {
        should(error).be.instanceOf(Error)
      })
    })(done)
  })

  tman.it('client.hset, client.hsetnx, client.hvals', function (done) {
    client.hvals('hash')(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql([])
      return this.hset('hash', 'key', 123)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hset('hash', 'key', 456)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.hget('hash', 'key')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('456')
      return this.hsetnx('hash', 'key', 0)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.hget('hash', 'key')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('456')
      return this.hsetnx('hash', 'key1', 'hello')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hsetnx('hash1', 'key1', 'hello')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal(1)
      return this.hget('hash', 'key1')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('hello')
      return this.hget('hash1', 'key1')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('hello')
      return this.hvals('hash1')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql(['hello'])
    })(done)
  })

  tman.it('client.hscan', function (done) {
    let count = 100
    const data = {}
    let scanKeys = []

    while (count--) data['key' + count] = count

    function fullScan (key, cursor) {
      return client.hscan(key, cursor)(function (error, res) {
        should(error).be.equal(null)
        scanKeys = scanKeys.concat(res[1])
        if (res[0] === '0') return res
        return fullScan(key, res[0])
      })
    }

    client.hscan('hash', 0)(function (error, res) {
      should(error).be.equal(null)
      should(res).be.eql(['0', []])
      return client.hmset('hash', data)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res).be.equal('OK')
      return fullScan('hash', 0)
    })(function (error, res) {
      should(error).be.equal(null)
      should(scanKeys.length).be.equal(200)
      for (const key of Object.keys(data)) {
        should(scanKeys).be.containEql(data[key] + '')
        should(scanKeys).be.containEql(key)
      }
      return this.hscan('hash', '0', 'count', 20)
    })(function (error, res) {
      should(error).be.equal(null)
      should(res[0] >= 0).be.equal(true)
      should(Object.keys(res[1]).length > 0).be.equal(true)
      return this.hscan('hash', '0', 'count', 200, 'match', '*0')
    })(function (error, res) {
      should(error).be.equal(null)
      should(res[0] === '0').be.equal(true)
      should(Object.keys(res[1]).length === 20).be.equal(true)
    })(done)
  })

  tman.it('client.hstrlen', function (done) {
    client.hstrlen('key', 'f')(function (error, res) {
      if (error && /unknown command/.test(error.message)) {
        console.log('Do not support "hstrlen"')
        return done()
      }
      should(error).be.equal(null)
      should(res).be.equal(0)
      return this.hmset('key', 'f1', 'HelloWorld', 'f2', 99, 'f3', '-256')(function (error, res) {
        should(error).be.equal(null)
        should(res).be.equal('OK')
        return this.hstrlen('key', 'f0')
      })(function (error, res) {
        should(error).be.equal(null)
        should(res).be.equal(0)
        return this.hstrlen('key', 'f1')
      })(function (error, res) {
        should(error).be.equal(null)
        should(res).be.equal(10)
        return this.hstrlen('key', 'f2')
      })(function (error, res) {
        should(error).be.equal(null)
        should(res).be.equal(2)
        return this.hstrlen('key', 'f3')
      })(function (error, res) {
        should(error).be.equal(null)
        should(res).be.equal(4)
      })(done)
    })
  })
})
