/**
 * Extension Template: TypeScript
 *
 * This Extension is ready to be built and run out-of-the-box.
 * It features lots of useful utilities and examples
 * to help you get started.
 */

import {
  run,
  info,
  remove,
  dockerBuild
} from './lib'
import {
  Logger,
  ReportExecutionResult
} from '@serverless/ext-utils'

interface ExtensionExecutionData {
  instanceName: string
  action: string
  config: {
    name: string
  }
}

/**
 * This is the entrypoint for your extension.
 */
const exec = async (): Promise<void> => {
  // Parse the Extension execution data
  const execData = JSON.parse(process.argv[2]) as ExtensionExecutionData

  await Logger.debug(`Initializing the "${execData.action}" action`)
  await Logger.debug(execData)

  // Route the Extension Action
  switch (execData.action) {
    case 'run':
      await run(execData)
      break
    case 'info':
      await info(execData)
      break
    case 'remove':
      await remove(execData)
      break
    case 'docker-build':
      await dockerBuild(execData)
      break
    default:
      throw new Error(`Unknown action: ${execData.action}`)
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
