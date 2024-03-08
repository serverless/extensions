/**
 * Extension Action: Info
 *
 * This is a useful action for providing essential state information
 * from your Extension within the user's CLI.
 */

import { ExecutionStatus, Logger, ReportExecutionResult } from '@serverless/ext-utils'
import { execSync } from 'child_process'
import { type ExtensionExecutionData } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running the "info" action')

  try {
    const version = execSync('docker version')
    await Logger.info(version.toString())

    const inspect = execSync(`docker image inspect ${execData.config.name}`)
    await Logger.info(inspect.toString())
  } catch (error: any) {
    await ReportExecutionResult({
      status: ExecutionStatus.FAILED,
      error
    })
  }

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL
  })
}
