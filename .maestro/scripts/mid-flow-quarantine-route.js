// S6-T6 / UC-SURF-06 — Maestro mid-flow quarantine flip (fail-closed)
//
// Shells out to mid-flow-quarantine-route.sh which runs:
//   npx convex run curatedGeometryTestSupport:quarantineRouteByRouteIdPublic
//     '{"routeId":"cherohala-skyway",...}' --identity '{...}'
//
// Sets output.quarantineConfirmed / output.riderReady for YAML assertTrue.
// Throws on non-zero exit so the Maestro flow aborts if the flip did not land.

var ProcessBuilder = Java.type('java.lang.ProcessBuilder')
var BufferedReader = Java.type('java.io.BufferedReader')
var InputStreamReader = Java.type('java.io.InputStreamReader')
var File = Java.type('java.io.File')
var System = Java.type('java.lang.System')

var routeId =
  typeof ROUTE_ID !== 'undefined' && ROUTE_ID != null && String(ROUTE_ID).length > 0
    ? String(ROUTE_ID)
    : 'cherohala-skyway'

var cwd = System.getProperty('user.dir')
var scriptPath = cwd + '/.maestro/scripts/mid-flow-quarantine-route.sh'
var scriptFile = new File(scriptPath)
// Declared at module root (Biome noInnerDeclarations); Rhino has no let/const.
var alt = new File(cwd + '/scripts/mid-flow-quarantine-route.sh')
if (!scriptFile.exists()) {
  // Fallback when Maestro launches with CWD = .maestro/
  if (alt.exists()) {
    scriptPath = alt.getAbsolutePath()
    cwd = new File(cwd).getParent()
  }
}

var pb = new ProcessBuilder('bash', scriptPath)
pb.directory(new File(cwd))
pb.redirectErrorStream(true)
var env = pb.environment()
env.put('ROUTE_ID', routeId)
var deployment = System.getenv('CONVEX_DEPLOYMENT')
if (deployment != null && String(deployment).length > 0) {
  env.put('CONVEX_DEPLOYMENT', String(deployment))
}

var proc = pb.start()
var reader = new BufferedReader(new InputStreamReader(proc.getInputStream()))
var lines = []
var line = reader.readLine()
while (line != null) {
  lines.push(String(line))
  console.log(line)
  line = reader.readLine()
}
var code = proc.waitFor()
var stdout = lines.join('\n')

output.routeId = routeId
output.quarantineExit = code
output.quarantineStdout = stdout
// True when the public_api result proves the route's riderReady is false.
output.routeRiderReadyIsFalse =
  stdout.indexOf('"riderReady":false') >= 0 || stdout.indexOf('"riderReady": false') >= 0
output.quarantineConfirmed = code === 0 && output.routeRiderReadyIsFalse === true

if (!output.quarantineConfirmed) {
  throw new Error(
    'mid-flow quarantine flip FAILED for routeId=' +
      routeId +
      ' exit=' +
      code +
      ' routeRiderReadyIsFalse=' +
      output.routeRiderReadyIsFalse +
      ' stdout=' +
      stdout,
  )
}
