/**
 * Extension Action: Remove
 *
 * This is an essential action for removing any
 * resources created by your Extension.
 */

import { ExecutionStatus, Logger, ReportExecutionResult } from '@serverless/ext-utils'
import { execSync } from 'child_process'
import { type ExtensionExecutionData } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running the "remove" action')

  try {
    const res = execSync(`docker image rm ${execData.config.name}`)
    await Logger.info(res.toString())
    await Logger.info('Docker Image Removed Successfully')
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
