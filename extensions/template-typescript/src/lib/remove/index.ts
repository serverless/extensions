/**
 * Extension Action: Remove
 *
 * This is an essential action for removing any
 * resources created by your Extension.
 */

import { ExecutionStatus, Logger, ReportExecutionResult, StoreState } from '@serverless/ext-utils'
import { type ExtensionExecutionData } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running the "remove" action')

  // The StoreState utility function is used to store the state of the extension.
  // If the state has to be cleared, pass an empty object to StoreState.
  await StoreState({})

  await Logger.info('Instance Removed Successfully')

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL, // The status of the execution
    outputStateKeys: [] // State keys to include in the CLI output
  })
}
