
let metricData = ''
let nodeMetric = ''

export function getMetricData () {
  return metricData + nodeMetric
}

export function generateTaskMetric (tasks: any[]) {
  metricData = (
    generateMetric({
      id: 'tasks_cpu_percentage',
      key: 'cpuPercentage',
      tasks,
    })
    + generateMetric({
      id: 'tasks_memory_percentage',
      key: 'memoryPercentage',
      tasks,
    })
    + generateMetric({
      id: 'tasks_cpu_usage',
      key: 'cpu',
      tasks,
    })
    + generateMetric({
      id: 'tasks_memory_usage',
      key: 'memory',
      tasks,
    })
    + checkFail({
      id: 'tasks_fail',
      tasks,
    })
  )
}

export async function generateNodeMetric (nodes: any[]) {
  // const proc = await Deno.run({
  //   cmd: ['bash', '-c', 'df --output=source,pcent | grep 172'],
  //   stdout: 'piped',
  // })
  // const stdout = new TextDecoder().decode(await proc.output())
  // const shareDiskPer = /\s(\d+)%/.exec(stdout.trim()) || ['', '0']

  let data = (
    nodeState({nodes})
    + metricNode({
      key: 'memory',
      nodes,
    })
    + metricNode({
      key: 'cpu',
      nodes,
    })
    + metricNode({
      key: 'disk',
      nodes,
      extraKeys: ['diskType="main"'],
    })
    // + 'nodes_disk_percentage'
    // + '{nodeName="media-node", role="manager", id="7ekdy40jylb15c1bjxuxlgsjl", diskType="gfs-share"} '
    // + shareDiskPer[1] + '\n'
  )

  nodeMetric = data
}

type MetricOpts = {
 id: string
 key: string
 tasks: any[]
}
function generateMetric(opts: MetricOpts) {
  const extraKeys = ['taskName', 'id', 'serviceName',]
  let data = `# HELP ${opts.id}
# TYPE ${opts.id} gauge\n`

  for (const d of opts.tasks) {
    if (d.state !== 'running') continue

    const keys = extraKeys.map(k => `${k}="${d[k]}"`)

    const [stack, name] = d.taskName.split('_')
    keys.push(`prettyName="${name} (${stack.replace('production-', '').replace('staging-', '')})"`)

    let stage = 'other'
    if (d.taskName.startsWith('production'))
      stage = 'production'
    else if (d.taskName.startsWith('staging'))
      stage = 'staging'

    keys.push(`stage="${stage}"`)

    const stats = d.stats ? d.stats[opts.key] : 0
    data += `${opts.id}{${keys.join(',')}} ${stats}\n`
  }

  return data
}

function checkFail(opts: {
 id: string
 tasks: any[]
}) {
  const extraKeys = ['taskName', 'id', 'serviceName',]
  let data = `# HELP ${opts.id}
# TYPE ${opts.id} gauge\n`

  for (const d of opts.tasks) {
    const keys = extraKeys.map(k => `${k}="${d[k]}"`)
    const stats = d.status.error ? 1 : 0

    data += `${opts.id}{${keys.join(',')}} ${stats}\n`
  }

  return data
}

function metricNode(opts: {
 key: string
 nodes: any[]
 extraKeys?: string[]
}) {
  const id = `nodes_${opts.key}_percentage`
  const extraKeys = ['nodeName', 'role', 'id']
  let data = `# HELP ${id}
# TYPE ${id} gauge\n`

  for (const d of opts.nodes) {
    const keys = extraKeys.map(k => `${k}="${d[k]}"`)
    if (opts.extraKeys)
      keys.push(...opts.extraKeys)

    const stats = d.stats ? d.stats[opts.key].usedPercentage : 0
    data += `${id}{${keys.join(',')}} ${stats}\n`
  }

  return data
}

function nodeState(opts: {nodes: any[]}) {
  const id = 'nodes_state'
  const extraKeys = ['nodeName', 'role', 'id']
  let data = `# HELP ${id}
# TYPE ${id} gauge\n`

  for (const d of opts.nodes) {
    const keys = extraKeys.map(k => `${k}="${d[k]}"`)
    const stats = d.state === 'ready' ? 1 : 0

    data += `${id}{${keys.join(',')}} ${stats}\n`
  }

  return data
}