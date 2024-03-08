/**
 * Extension Action: Custom Command
 *
 * This is an example of a custom action that you can define for your extension.
 */

import { ExecutionStatus, Logger, ReportExecutionResult } from '@serverless/ext-utils'
import { type ExtensionExecutionData } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running Custom Command')

  // Besides the "run", "remove", and "info" actions, you can define any custom actions for your extension.
  // You can define any number of custom commands for your extension.
  // Each command should be specified in the "commands" field of the extension.yml file.
  // You can add any custom logic here to perform the action.
  // This function will be called when the user runs "serverless ext <extension-instance-name> custom-command".
  // You can also add any additional arguments to the function signature to receive data from the CLI.

  await Logger.info(`Hello, ${execData.action[1]}!`)

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL
  })
}
