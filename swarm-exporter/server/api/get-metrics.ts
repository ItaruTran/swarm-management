import { statsCollector } from '../lib/stats-collector.ts';
import { getMetricData } from '../lib/generate-metric.ts';

export function getMetrics(_: Request) {
  try {
    let data = getMetricData()

    const sid = 'stats_collector_time'
    const now = Date.now()
    data += `# HELP ${sid}
# TYPE ${sid} gauge
${sid}{name="nodeMetricTime"} ${now - statsCollector._nodeMetricTime}
${sid}{name="taskMetricTime"} ${now - statsCollector._taskMetricTime}`

    return new Response(data)
  } catch (error) {
    console.error(error);
  }

  return new Response('', {status: 500})
}
