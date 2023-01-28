
const exitFuncs: VoidFunction[] = []

export function addExit(cb: VoidFunction) {
  exitFuncs.push(cb)
}

export function removeExit(cb: VoidFunction) {
  const index = exitFuncs.indexOf(cb);
  if (index > -1) {
    exitFuncs.splice(index, 1);
  }
}

async function signalHandler() {
  await Promise.any([
    Deno.signal("SIGTERM"),
    Deno.signal('SIGINT'),
  ])

  for (const cb of exitFuncs) {
    cb();
  }
  console.log('Process should exit for now');
}

signalHandler()