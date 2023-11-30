/**
 * Extension Action: Docker Build
 *
 * This builds a Dockerfile.
 */

import {
  Logger,
  ReportExecutionResult
} from '@serverless/ext-utils'
import { execSync, spawn } from 'child_process'

export default async (execData: any = {}): Promise<void> => {
  await Logger.info('Running Docker Build')

  const res = execSync('docker version')

  const data = res.toString()

  await Logger.info(data)

  const tag = execData?.config?.name !== undefined ? (execData.config.name as string).replace(/\W/, '-') : 'build-in-docker-test'

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
    status: 0
  })
}
