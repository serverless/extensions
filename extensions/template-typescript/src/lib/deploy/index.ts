/**
 * Extension Action: Run
 *
 * This is the default action for your extension.
 * It is best used for deploying a use-case or running a script.
 */

import {
  CredentialVendor,
  ExecutionStatus,
  GetCredentials,
  Logger, Progress, Prompt,
  ReportExecutionResult,
  StoreState
} from '@serverless/ext-utils'
import { type ExtensionExecutionData } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running the "run" action')

  // Get credentials using the GetCredentials utility function from the ext-utils package
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const credentials = await GetCredentials(CredentialVendor.AWS)

  // The Prompt utility function is used to prompt the user for input in the CLI.
  // It has several input options, such as input, select and confirm.
  const name = await Prompt({
    input: {
      message: 'What is your name?'
    }
  })

  // Here is an example of a select prompt
  const age = await Prompt({
    select: {
      message: 'What is your age?',
      choices: [{ name: '0-18', value: 'teen' }, { name: '19-65', value: 'adult' }, { name: '65+', value: 'senior' }]
    }
  })

  // Use config (provided by user in serverless.yml) to determine if we should skip the confirmation prompt
  if (execData?.config?.confirm ?? true) {
    // The confirmation prompt is used to confirm the user's input
    const confirmed = await Prompt({
      confirm: {
        message: `Your name is ${name} and you are a/an ${age} - is this correct?`
      }
    })

    if (confirmed === 'false') {
      await Logger.error('You must confirm your details to proceed')
      // Use the ReportExecutionResult utility function to report failed execution
      // Provide an error message to give the user context on why the execution failed
      await ReportExecutionResult({
        status: ExecutionStatus.FAILED,
        error: new Error('User did not confirm')
      })
    }
  }

  // The Progress utility function is used to display a spinner in the CLI.
  // It takes a single argument, which is an object that contains the name and message of the spinner.
  const p = await Progress({ name: 'run-action', message: 'Running the "run" action' })
  // Wait for 2 seconds to simulate processing
  await new Promise((resolve) => setTimeout(resolve, 2000))
  // The update method is used to update the message of the spinner.
  await p.update('Still processing...')
  // Wait for another 2 seconds to simulate processing
  await new Promise((resolve) => setTimeout(resolve, 2000))
  // The remove method is used to remove the spinner from the CLI.
  await p.remove()

  // The StoreState utility function is used to store the state of the extension.
  // It takes a single argument, which is an object that represents the state of the extension.
  await StoreState({
    foo: 'bar',
    nestedObject: {
      fizz: 'buzz'
    },
    nestedArray: [
      'array-item1',
      'array-item2'
    ],
    user: {
      name,
      age
    }
  })

  // The ReportExecutionResult utility function is used to report the result of the extension execution.
  // It takes a single argument,
  // which is an object that contains the status of the execution and the state keys to include in the CLI output.
  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL, // The status of the execution
    outputStateKeys: ['user'] // State keys to include in the CLI output
  })
}
