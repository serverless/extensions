/**
 * Extension Action: Run
 *
 * This is the default action for your extension.
 * It is best used for deploying a use-case or running a script.
 */

import {
  ExecutionStatus,
  Logger,
  ReportExecutionResult
} from '@serverless/ext-utils'
import { spawn } from 'child_process'
import { type ExtensionExecutionData } from '../../index'

export default async (execData: ExtensionExecutionData): Promise<void> => {
  await Logger.debug('Running the "run" action')

  const tag = execData?.config?.name !== undefined ? (execData.config.name).replace(/\W/, '-') : 'build-in-docker-test'

  // Thanks to docker-build permission added to extension.yml, the extension has the permission to run docker commands.
  const buildProcess = spawn('docker', ['build', '-f', '/workspace/Dockerfile', '-t', tag, '/workspace'])

  await new Promise<void>((resolve, reject) => {
    buildProcess.stdout.on('data', (data) => {
      Logger.info(data.toString()).catch(() => { /** */ })
    })

    buildProcess.stderr.on('data', (data) => {
      Logger.error(data.toString()).catch(() => { /**  */ })
    })

    buildProcess.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error('Docker build failed'))
      }
    })

    buildProcess.on('error', (err) => {
      Logger.error(err).catch(() => { /** */ }).finally(() => {
        reject(new Error('Docker build failed'))
      })
    })
  })

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL
  })
}
