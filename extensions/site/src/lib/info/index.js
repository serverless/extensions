/**
 * Extension Action: Info
 *
 * This is a useful action for providing essential state information
 * from your Extension within the user's CLI.
 */
import {
  Logger,
  GetState,
  ReportExecutionResult
} from '@serverless/ext-utils'

export default async (execData = {}) => {
  // Get state
  const state = await GetState() || {}
  state.aws = state.aws ?? {}

  // Add outputs
  await Logger.debug('Reporting execution result')
  const outputStateKeys = [
    'domain',
    'aws.s3BucketWebsiteUrl',
    'aws.cloudfrontDistributionUrl',
    'aws.route53HostedZoneNameservers'
  ]

  await ReportExecutionResult({
    status: 0, // 0 is for success,
    outputStateKeys
  })
}
