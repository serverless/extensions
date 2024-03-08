/**
 * Extension Action: Info
 *
 * This is a useful action for providing essential state information
 * from your Extension within the user's CLI.
 */

import { ExecutionStatus, GetState, Logger, ReportExecutionResult } from '@serverless/ext-utils'
import { type ExtensionExecutionData, type State } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running the "info" action')

  // You can add any custom logic here to gather information about the state of your Extension.
  // This information will be reported back to the user when they run "serverless ext info"
  // or "serverless ext <extension-instance-name> info".

  // The GetState utility function returns the current state of the extension.
  // The state is a JSON object that can be used to store data between executions of the extension.
  const state = await GetState<State>()
  if ((state?.user) != null) {
    await Logger.info(`The last user was ${state.user.name} and they were a/an ${state.user.age}`)
  } else {
    await Logger.warning('No user has been stored yet. To store a user, run "serverless ext <extension-instance-name> run"')
  }

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL
  })
}
