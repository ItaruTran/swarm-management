
import { sleep } from '../utils/promise-wraper.ts'
import { ApiEndpoint, ApiToken } from '../env.ts'
import { httpGetStream } from './http.ts'
import { generateTaskMetric, generateNodeMetric } from './generate-metric.ts'

type StatsHandler = (data: any[]) => void

class StatsCollector {
  isRunning = false
  currentTasks: any[] = []
  _taskMetricTime = Date.now()
  _nodeMetricTime = Date.now()

  constructor() {
  }

  start() {
    this.isRunning = true

    this._getStats('ezpoYW5kbGVyIDp0YXNrLWxpc3QsIDpwYXJhbXMge319', this._taskParser)
    this._getStats('ezpoYW5kbGVyIDpub2RlLWxpc3QsIDpwYXJhbXMge319', this._nodeParser)
  }
  stop = () => {
    this.isRunning = false
  }

  async _getStats(subscription: string, handler: StatsHandler) {
    while (this.isRunning) {
      console.log('StatsCollector: reconnecting');
      try {
        const res = await fetch(`${ApiEndpoint}/slt`, {
          headers: {
            Authorization: ApiToken,
          }
        })
        if (!res.ok)
          throw res
        const { slt } = await res.json()

        await httpGetStream(
          `${ApiEndpoint}/events?slt=${slt}&subscription=${subscription}`,
          {},
          handler
        )
      } catch (error) {
        console.error(error);

        await sleep(1000)
      }
    }
    console.log('StatsCollector: exit');
  }

  _taskParser = (data: any[]) => {
    const taskes: any = {}
    for (const iterator of data) {
      if (iterator.desiredState === 'shutdown' && iterator.desiredState === iterator.state)
        continue

      if (!taskes[iterator.id]) {
        taskes[iterator.id] = iterator
      } else if (
        // iterator.desiredState !== 'shutdown' &&
        taskes[iterator.id].id === iterator.id &&
        taskes[iterator.id].updatedAt < iterator.updatedAt
      ) {
        taskes[iterator.id] = iterator
      }
    }

    // console.log(`StatsCollector: Update new data ${new Date().toISOString()}`);
    this.currentTasks = Object.values(taskes).sort(compare)

    generateTaskMetric(this.currentTasks)
    this._taskMetricTime = Date.now()
  }

  _nodeParser = (data: any[]) => {
    generateNodeMetric(data).catch(console.error)
    this._nodeMetricTime = Date.now()
  }
}

export const statsCollector = new StatsCollector()

function compare(a: any, b: any) {
  if (a.taskName < b.taskName) {
    return -1;
  }
  if (a.taskName > b.taskName) {
    return 1;
  }
  return 0;
}