/**
 * Extension Action: Info
 *
 * This is a useful action for providing essential state information
 * from your Extension within the user's CLI.
 */

import {
  ReportExecutionResult,
} from '@serverless/ext-utils'

export default async (execData = {}): Promise<void> => {

  // Example: Debug statement
  await Logger.debug('Running the "info" action')

  // Example: Reporting Execution Result
  await ReportExecutionResult({
    status: 0, // 0 = Success, 1 = Failure
    outputStateKeys: ['foo', 'nestedObject'] // State keys to include in the CLI output
  })
}
