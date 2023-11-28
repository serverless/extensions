/**
 * Extension Action: Remove
 *
 * This is an essential action for removing any
 * resources created by your Extension.
 */

import {
  Logger,
  StoreState,
  ReportExecutionResult
} from '@serverless/ext-utils'

export default async (execData = {}): Promise<void> => {
  // Example: Debug statement
  await Logger.debug('Running the "remove" action')

  // Example: Delete State
  await StoreState({})

  await Logger.info('Instance Removed Successfully')

  // Example: Reporting Execution Result
  await ReportExecutionResult({
    status: 0, // 0 = Success, 1 = Failure
    outputStateKeys: [] // State keys to include in the CLI output
  })
}
