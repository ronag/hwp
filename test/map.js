'use strict'

const { test } = require('tap')
const { promisify } = require('util')
const hwp = require('..')

const immediate = promisify(setImmediate)

test('process an async iterator', async (t) => {
  const expected = ['a', 'b', 'c']
  const uppercased = [...expected.map((s) => s.toUpperCase())]

  async function * something () {
    const toSend = [...expected]
    yield * toSend
  }

  const res = hwp.mapIterator(something(), async function (item) {
    t.equal(item, expected.shift())
    return item.toUpperCase()
  })

  for await (const item of res) {
    t.equal(item, uppercased.shift())
  }
})

test('process an async iterator with a batch factor', async (t) => {
  const expected = []

  for (let i = 0; i < 42; i++) {
    expected.push(i)
  }

  const doubled = [...expected.map((s) => s * 2)]

  async function * something () {
    const toSend = [...expected]
    yield * toSend
  }

  let started = 0
  let finished = 0
  let max = 0

  const res = hwp.mapIterator(something(), async function (item) {
    started++
    // parallelism
    t.equal(started - finished <= 16, true)
    t.equal(item, expected.shift())
    await immediate()
    finished++
    max = Math.max(max, started - finished)
    return item * 2
  })

  for await (const item of res) {
    t.equal(item, doubled.shift())
  }

  t.equal(max > 1, true)
})

test('first element errors', async (t) => {
  const expected = []

  for (let i = 0; i < 42; i++) {
    expected.push(i)
  }

  const doubled = [...expected.map((s) => s * 2)]

  async function * something () {
    const toSend = [...expected]
    for (const chunk of toSend) {
      immediate()
      yield chunk
    }
  }

  let started = 0

  const res = hwp.mapIterator(something(), async function (item) {
    const first = started === 0
    started++
    if (first) {
      throw new Error('kaboom')
    }
    return item * 2
  })

  try {
    for await (const item of res) {
      t.equal(item, doubled.shift())
    }
    t.fail('must throw')
  } catch (err) {
    // This is 3 in this example
    t.equal(started > 1, true)
  }
})

test('highwatermark', async (t) => {
  const expected = []

  for (let i = 0; i < 42; i++) {
    expected.push(i)
  }

  const doubled = [...expected.map((s) => s * 2)]

  async function * something () {
    const toSend = [...expected]
    yield * toSend
  }

  let started = 0
  let finished = 0
  let max = 0

  const res = hwp.mapIterator(something(), async function (item) {
    started++
    // parallelism
    t.equal(started - finished <= 5, true)
    t.equal(item, expected.shift())
    await immediate()
    finished++
    max = Math.max(max, started - finished)
    return item * 2
  }, 5)

  for await (const item of res) {
    t.equal(item, doubled.shift())
  }

  t.equal(max > 1, true)
})

test('accumulate result with an async iterator with a batch factor', async (t) => {
  const expected = []

  for (let i = 0; i < 42; i++) {
    expected.push(i)
  }

  const doubled = [...expected.map((s) => s * 2)]

  async function * something () {
    const toSend = [...expected]
    yield * toSend
  }

  let started = 0
  let finished = 0
  let max = 0

  const res = await hwp.map(something(), async function (item) {
    started++
    // parallelism
    t.equal(started - finished <= 16, true)
    t.equal(item, expected.shift())
    await immediate()
    finished++
    max = Math.max(max, started - finished)
    return item * 2
  })

  t.same(res, doubled)

  t.equal(max > 1, true)
})
