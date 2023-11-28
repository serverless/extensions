import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { CredentialVendor, ExecutionStatus, GetCredentials, Logger, ReportExecutionResult } from '@serverless/ext-utils'
import { z } from 'zod'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

const Input = z.object({
  serviceName: z.string(),
  action: z.enum(['start', 'finish']),
  config: z.object({
    bucket: z.string(),
    prefix: z.string().optional()
  })
})

// eslint-disable-next-line @typescript-eslint/no-redeclare
type Input = z.infer<typeof Input>

try {
  if (process.argv.length < 3) {
    throw new Error('Input was not provided')
  }
  const input = Input.parse(JSON.parse(process.argv[2]))

  await GetCredentials(CredentialVendor.AWS)

  const s3Client = new S3Client({ region: 'us-east-1' })

  const remoteStateKey = `${input.config.prefix !== undefined ? `${input.config.prefix}/` : ''}${input.serviceName}/state.json`

  if (input.action === 'start') {
    await Logger.debug('Syncing State to Local Store')
    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: input.config.bucket,
        Key: remoteStateKey
      }))
      if (response.Body !== undefined) {
        const body = await response.Body.transformToString()
        await Logger.debug(body)
        await writeFile(path.join('workspace', '.extensions', 'state.json'), body)
      }
    } catch (err) {
      await Logger.debug(err)
    }
  } else if (input.action === 'finish') {
    await Logger.debug('Syncing State to S3')
    try {
      const currentRemoteStateResponse = await s3Client.send(new GetObjectCommand({
        Bucket: input.config.s3Bucket,
        Key: remoteStateKey
      }))
      if (currentRemoteStateResponse.Body !== undefined) {
        await Logger.debug('Storing version of existing state')
        const body = await currentRemoteStateResponse.Body.transformToString()
        const versionedFileName = `state-${(new Date()).getTime()}.json`
        await s3Client.send(new PutObjectCommand({
          Bucket: input.config.s3Bucket,
          Key: remoteStateKey.replace('state.json', versionedFileName),
          Body: body
        }))
      }
    } catch (err) {
      await Logger.debug(err)
    }

    const localState = await readFile(path.join('workspace', '.extensions', 'state.json'))
    await s3Client.send(new PutObjectCommand({
      Bucket: input.config.s3Bucket,
      Key: remoteStateKey,
      Body: localState
    }))
  }

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL
  })
} catch (err) {
  console.error(err)
  await ReportExecutionResult({
    status: ExecutionStatus.FAILED,
    error: err as Error
  })
}
