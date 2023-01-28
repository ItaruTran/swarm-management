import { addExit, removeExit } from './exit-listener.ts';

const textDecoder = new TextDecoder()

export async function httpGetStream(url: string, opts: RequestInit, cb: (data: any) => void) {
  const res = await fetch(url, opts)

  if (!res.body || !res.ok)
    throw res;

  let cache = '', hasNewData = false, data = '';
  const bodyReader = res.body.getReader()

  const exitStream = async () => {
    await bodyReader.cancel()
  }
  addExit(exitStream)
  setTimeout(exitStream, 300000);

  while (true) {
    const body = await bodyReader.read()
    if (body.done)
      break

    const chunk = textDecoder.decode(body.value)

    if (chunk === ':ok\n\n')
      continue

    if (chunk.startsWith('data: ') && chunk.endsWith('\n\n')) {
      cb(JSON.parse(chunk.replace('data: ', '')))
    } else if (!hasNewData && chunk.startsWith('data: ')) {
      cache = chunk.replace('data: ', '')
      hasNewData = true
    } else if (hasNewData && chunk.endsWith('\n\n')) {
      cache += chunk
      hasNewData = false

      const data = JSON.parse(cache)
      cb(data)
    } else if (hasNewData) {
      cache += chunk
    } else {
      data += chunk;
    }
  }

  removeExit(exitStream)

  return {
    statusCode: res.status,
    fail: !res.ok,
    data: data,
  }
}