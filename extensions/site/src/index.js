/**
 * Extension: Site
 */

import {
  run,
  info,
  remove
} from './lib/index.js'
import {
  Logger,
  ReportExecutionResult
} from '@serverless/ext-utils'

/**
 * This is the entrypoint for your extension.
 */
const exec = async () => {
  // Parse the Extension execution data
  const execData = JSON.parse(process.argv[2])

  await Logger.debug(`Initializing the "${execData.action}" action`)
  await Logger.debug(execData)

  // Route the Extension Action
  switch (execData.action[0]) {
    case 'run':
      await run(execData)
      break
    case 'info':
      await info(execData)
      break
    case 'remove':
      await remove(execData)
      break
    default:
      throw new Error(`Unsupported Action: "${execData.action}"`)
  }
}

/**
 * Execute the Extension and handle errors
 */
exec().catch(async (error) => {
  await Logger.info(error)
  await ReportExecutionResult({
    status: 1, // 1 is for failure
    error
  })
})
