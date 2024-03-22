/**
 * Extension Template: TypeScript
 *
 * This Extension is ready to be built and run out-of-the-box.
 * It features lots of useful utilities and examples
 * to help you get started.
 */

import { customCommand, info, remove, deploy } from './lib'
import { ExecutionStatus, Logger, ReportExecutionResult } from '@serverless/ext-utils'

// The configuration for the Extension that is specified in the extension.yml file.
// This is the configuration that the user will provide when they use the Extension.
export interface Config {
  confirm: boolean
}

// The data that is passed to the Extension when it is executed.
// In addition to the configuration, this data will also include the action that the Extension should perform.
// This data is passed to the Extension as a JSON string in the process.argv[2] argument.
export interface ExtensionExecutionData {
  instanceName: string
  action: string[]
  config: Config
}

// The state schema for the Extension.
export interface State {
  foo: string
  nestedObject: {
    fizz: string
  }
  nestedArray: string[]
  user: {
    name: string
    age: string
  }
}

/**
 * This is the entrypoint for your extension.
 */
const exec = async (): Promise<void> => {
  // Parse the Extension execution data
  const execData = JSON.parse(process.argv[2]) as ExtensionExecutionData

  // Use the Logger from the ext-utils package to log messages.
  // Debug logs are useful for troubleshooting and are hidden by default.
  // They can be enabled by setting the SLS_DEBUG environment variable to true.
  await Logger.debug(`Initializing the "${execData.action.join(' ')}" action`)
  await Logger.debug(execData)

  // Perform the action that was specified in the execution data.
  // Instead of using a switch statement, you can also use more sophisticated routing logic
  // by using a library for handling the CLI commands like yargs.
  switch (execData.action[0]) {
    case 'deploy':
      await deploy(execData)
      break
    case 'info':
      await info(execData)
      break
    case 'remove':
      await remove(execData)
      break
    case 'custom-command':
      await customCommand(execData)
      break
    default:
      throw new Error(`Unknown action: "${execData.action.join(' ')}"`)
  }
}

/**
 * Execute the Extension and handle errors
 */
exec().catch(async (error) => {
  // Log the error
  await Logger.error(error)

  // Report the error
  await ReportExecutionResult({
    status: ExecutionStatus.FAILED,
    error
  })
})
