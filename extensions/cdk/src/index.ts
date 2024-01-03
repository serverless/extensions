import { AwsCdkCli, RequireApproval } from '@aws-cdk/cli-lib-alpha'
import { CredentialVendor, ExecutionStatus, GetCredentials, GetState, Logger, ReportExecutionResult, StoreState } from '@serverless/ext-utils'
import { readFile, rm } from 'fs/promises'

interface ExtensionInput {
  instanceName: string
  action: string[]
  config: { path?: string, region?: string }
}

const info = async (input: ExtensionInput): Promise<void> => {
  const state = await GetState()
  await Logger.info(state)
}

const bootstrap = async (input: ExtensionInput): Promise<void> => {
  await Logger.info('Bootstrapping CDK')
  const basePath = input.config.path !== undefined ? `/workspace${input.config.path}` : '/workspace'
  const cli = AwsCdkCli.fromCdkAppDirectory(basePath, { output: '/tmp' })
  await cli.bootstrap()
  await Logger.info('Finished Bootstrapping CDK')
}

const remove = async (input: ExtensionInput): Promise<void> => {
  await Logger.info('Removing CDK Stack')
  const cli = AwsCdkCli.fromCdkAppDirectory('/workspace', { output: '/tmp' })

  await cli.destroy({
    requireApproval: false
  })

  await StoreState({})
  await Logger.info('Removed CDK Stack')
}

const deploy = async (input: ExtensionInput): Promise<void> => {
  await Logger.info('Deploying CDK App')
  const basePath = input.config.path !== undefined ? `/workspace${input.config.path}` : '/workspace'
  const cli = AwsCdkCli.fromCdkAppDirectory(basePath, { output: '/tmp' })

  const outputsFile = `${basePath}/outputs-${input.instanceName}.jsonn`
  await cli.deploy({
    requireApproval: RequireApproval.NEVER,
    outputsFile
  })

  const state = JSON.parse((await readFile(outputsFile)).toString('utf-8'))

  await Logger.info(state)
  await StoreState(state)

  await rm(outputsFile)
  await Logger.info('Finishing Deploying CDK App')
}

const run = async (): Promise<void> => {
  if (process.argv.length < 3) {
    throw new Error('Extension Input was not provided')
  }

  const input = JSON.parse(process.argv[2]) as ExtensionInput

  if (input.config.region !== undefined) {
    process.env.AWS_REGION = input.config.region
  }

  await GetCredentials(CredentialVendor.AWS)

  const action = input.action[0];
  if (action === 'info') {
    await info(input)
  } else if (action === 'run') {
    await deploy(input)
  } else if (action === 'remove') {
    await remove(input)
  } else if (action === 'bootstrap') {
    await bootstrap(input)
  }

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL,
  })
}

run().then(() => {}).catch(async (err) => {
  const error = err as Error
  await ReportExecutionResult({
    status: ExecutionStatus.FAILED,
    error
  })
})
