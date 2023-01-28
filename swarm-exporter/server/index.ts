
import { SvPort } from "./env.ts";
import { getMetrics } from "./api/get-metrics.ts";
import { statsCollector } from "./lib/stats-collector.ts";
import { addExit } from "./lib/exit-listener.ts";
import { listenAndServe } from "../deps.ts";

const controller = new AbortController()

listenAndServe(
  `:${SvPort}`,
  req => {
    const url = new URL(req.url)

    if (url.pathname.startsWith('/metrics'))
      return getMetrics(req)
    else if (url.pathname.startsWith('/health')) {
      return new Response('ok')
    } else {
      return new Response('', { status: 404 })
    }
  },
  { signal: controller.signal }
)

statsCollector.start()

addExit(statsCollector.stop)
addExit(() => controller.abort())
