import {
  CredentialVendor,
  ExecutionStatus,
  GetCredentials, GetState,
  Logger,
  ReportExecutionResult,
  StoreState
} from '@serverless/ext-utils'
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'

const exec = async () => {
  const execData = JSON.parse(process.argv[2])

  if (execData.action[0] === 'run') {
    await run(execData)
  } else if (execData.action[0] === 'remove') {
    await remove(execData)
  } else if (execData.action[0] === 'info') {
    await info(execData)
  } else if (execData.action[0] === 'publish-message') {
    await publish(execData)
  }

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCEEDED
  })
}

const run = async (execData) => {
  await Logger.info('Running the run action')
  const queueUrl = execData.config.queueUrl
  await StoreState({ queueUrl })
  await sendMessage(queueUrl, 'Test message', execData.config.region)
}

const info = async (execData) => {
  await Logger.info('Running the info action')
  await Logger.info(`Queue URL: ${execData.config.queueUrl}`)
}

const remove = async (execData) => {
  await Logger.info('Running the remove action')
  await StoreState({})
}

const publish = async (execData) => {
  await Logger.info('Running the publish action')
  const state = await GetState()
  if (state?.queueUrl === undefined) {
    await ReportExecutionResult({
      status: ExecutionStatus.FAILED,
      error: new Error('Queue URL not found in state')
    })
  }
  await sendMessage(state?.queueUrl, execData.action[1] ?? 'Test message', execData.config.region)
}

const sendMessage = async (queueUrl, messageBody, region) => {
  await GetCredentials(CredentialVendor.AWS)
  const sqsClient = new SQSClient({ region })
  const sendMsgCommand = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: messageBody
  })
  try {
    const data = await sqsClient.send(sendMsgCommand)
    await Logger.info(`Success, message sent. Message ID: ${data.MessageId}`)
  } catch (err) {
    await Logger.error(err.message)
  }
}

exec().catch(async (error) => {
  // Log the error
  await Logger.error(error)

  // Report the error
  await ReportExecutionResult({
    status: ExecutionStatus.FAILED,
    error
  })
})
