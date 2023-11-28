/**
 * Extension Action: Run
 *
 * This is the default action for your extension.
 * It is best used for deploying a use-case or running a script.
 */

import {
  Logger,
  GetState,
  StoreState,
  ReportExecutionResult,
  GetCredentials,
  CredentialVendor
} from '@serverless/ext-utils'

export default async (execData = {}): Promise<void> => {

  // Example: Debug statement
  await Logger.debug('Running the "run" action')

  // Get credentials
  // const credentials = await GetCredentials(CredentialVendor.AWS)

  // Example: Logging
  await Logger.info('This is a normal log message')
  await Logger.warning('This is a warning log message')
  await Logger.error('This is an error log message')

  // Example: Retrieving State
  const state: any = await GetState()
  await Logger.info(state)

  // Example: Storing State
  await StoreState({
    foo: 'bar',
    nestedObject: {
      fizz: 'buzz'
    },
    nestedArray: [
      'array-item',
      { array: 'object' }
    ]
  })

  // Example: Reporting Execution Result
  await ReportExecutionResult({
    status: 0, // 0 = Success, 1 = Failure
    outputStateKeys: ['foo', 'nestedObject'] // State keys to include in the CLI output
  })
}
