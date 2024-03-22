import { AwsCdkCli, RequireApproval, StackActivityProgress } from '@aws-cdk/cli-lib-alpha'
import {
  CredentialVendor,
  ExecutionStatus,
  GetCredentials,
  GetState,
  Logger,
  ReportExecutionResult,
  StoreState
} from '@serverless/ext-utils'
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

const synth = async (input: ExtensionInput): Promise<void> => {
  await Logger.info('Synthesizing CDK App')
  const basePath = input.config.path !== undefined ? `/workspace${input.config.path}` : '/workspace'
  const cli = AwsCdkCli.fromCdkAppDirectory(basePath, { output: '/tmp' })

  await cli.synth()
  await Logger.info('Finished Synthesizing CDK App')
}

const list = async (input: ExtensionInput): Promise<void> => {
  await Logger.info('Listing CDK Stacks')
  const basePath = input.config.path !== undefined ? `/workspace${input.config.path}` : '/workspace'
  const cli = AwsCdkCli.fromCdkAppDirectory(basePath, { output: '/tmp' })
  await cli.list({ long: true })
  await Logger.info('Listed CDK Stacks')
}

const remove = async (input: ExtensionInput): Promise<void> => {
  await Logger.info('Removing CDK Stack')
  const basePath = input.config.path !== undefined ? `/workspace${input.config.path}` : '/workspace'
  const cli = AwsCdkCli.fromCdkAppDirectory(basePath, { output: '/tmp' })

  await cli.destroy({
    requireApproval: false,
    color: false
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
    outputsFile,
    progress: StackActivityProgress.EVENTS
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
  process.env.CDK_DISABLE_VERSION_CHECK = '1'

  await GetCredentials(CredentialVendor.AWS)

  process.stdout.write = ((write) => (...args) => {
    // Dispatch the asynchronous logging operation without waiting for it to complete.
    Logger.info(args[0].toString()).catch(error => {
      console.error('Logger failed:', error)
    })
    // Call the original process.stdout.write method and return its result
    // This return value is important for stream backpressure management
    // @ts-expect-error - Bypassing TypeScript check because the overridden function
    // needs to accept a flexible number of arguments to handle all overloads of process.stdout.write.
    // The original .apply() method ensures the correct passing of arguments, but TypeScript
    // struggles with the dynamic argument types and counts here. We ensure at runtime that
    // the arguments align with the standard Node.js write() method signatures.
    return write.apply(process.stdout, args)
  })(process.stdout.write)

  process.stderr.write = ((write) => (...args) => {
    // Dispatch the asynchronous logging operation without waiting for it to complete.
    Logger.info(args[0].toString()).catch(error => {
      console.error('Logger failed:', error)
    })
    // Call the original process.stderr.write method to ensure output also goes to the console
    // @ts-expect-error - Bypassing TypeScript check because the overridden function
    // needs to accept a flexible number of arguments to handle all overloads of process.stderr.write.
    // The original .apply() method ensures the correct passing of arguments, but TypeScript
    // struggles with the dynamic argument types and counts here. We ensure at runtime that
    // the arguments align with the standard Node.js write() method signatures.
    return write.apply(process.stderr, args)
  })(process.stderr.write)

  const action = input.action[0]
  if (action === 'info') {
    await info(input)
  } else if (action === 'deploy') {
    await deploy(input)
  } else if (action === 'remove') {
    await remove(input)
  } else if (action === 'bootstrap') {
    await bootstrap(input)
  } else if (action === 'synth') {
    await synth(input)
  } else if (action === 'list') {
    await list(input)
  }

  await ReportExecutionResult({
    status: ExecutionStatus.SUCCESSFUL
  })
}

run().then(() => {
}).catch(async (err) => {
  const error = err as Error
  await ReportExecutionResult({
    status: ExecutionStatus.FAILED,
    error
  })
})
