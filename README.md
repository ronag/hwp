# hwp

Consume Async Interators with a highwatermark, i.e. in batches.
This allow for multiple processing happening in parallel instead of one at a time.

The default highwatermark is `16`.

## Install

```js
npm i hwp
```

## Usage

```js
import { forEach, map, mapIterator } from 'hwp'

const expected = ['a', 'b', 'c']

async function * something () {
  const toSend = [...expected]
  yield * toSend
}

await forEach(something(), async function (item) {
  // call an async function here instead
  console.log(item)
}, 16)

const res = mapIterator(something(), async function (item) {
  // call an async function here instead
  return item.toUpperCase()
}, 16)

for await (const item of res) {
  console.log(item)
}

console.log(await map(something(), async function (item) {
  // call an async function here instead
  return item.toUpperCase()
}), 16)
```

## License

MIT
