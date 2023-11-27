/**
 * Extension Action: Remove
 *
 */

import {
  Logger,
  GetState,
  StoreState,
  ReportExecutionResult,
  GetCredentials,
  CredentialVendor
} from '@serverless/ext-utils'
import {
  getAwsSdkClients,
  deleteCloudFrontDistribution,
  deleteS3Bucket,
  fetchAcmCertificateValidationRecord,
  removeRoute53DnsRecord,
  removeRoute53RecordsForCloudFront
} from '../shared.js'

export default async (execData = {}) => {
  /**
   * Initialization
   */
  await Logger.debug('Running the "remove" action')

  // Get credentials
  const credentials = await GetCredentials(CredentialVendor.AWS)

  // Get state
  const state = await GetState() || {}
  state.aws = state.aws ?? {}

  // Get AWS SDK Clients
  const clients = getAwsSdkClients(credentials, state.aws.region)

  // Fetch and remove ACM certificate validation CNAME record
  if (state.aws.acmCertificateArn) {
    const acmCertificateValidationRecord = await fetchAcmCertificateValidationRecord(
      clients,
      state.aws.acmCertificateArn
    )
    await removeRoute53DnsRecord(
      clients,
      state.aws.route53HostedZoneId,
      acmCertificateValidationRecord)
    // Inform user that ACM cert cannot be deleted
    await Logger.info(`This Extension does not delete AWS ACM certificates due to AWS SDK limitations. Please remove the certificate manually. Certificate ARN: ${state.aws.acmCertificateArn}`)
  }

  // Remove Route 53 Records for CloudFront Distribution
  if (state.aws.route53HostedZoneId && state.aws.cloudfrontDistributionUrl) {
    await Logger.debug('Removing Route 53 Records for CloudFront Distribution')
    const resCfDns = await removeRoute53RecordsForCloudFront(
      clients,
      state.domain,
      state.aws.route53HostedZoneId,
      state.aws.cloudfrontDistributionUrl)

    await Logger.info(resCfDns)
  }

  // Invalidate and Delete CloudFront Distribution
  await Logger.debug('Disabling and Deleting CloudFront Distribution. This will take a few minutes...')
  await deleteCloudFrontDistribution(clients, state.aws.cloudfrontDistributionId)

  // Empty and Delete S3 Bucket
  await Logger.debug('Emptying and Deleting S3 Bucket')
  await deleteS3Bucket(clients, state.aws.s3BucketName)

  // Delete state
  await StoreState({})

  /**
   * Report execution result
   */
  await Logger.debug('Reporting execution result')

  await ReportExecutionResult({
    status: 0
  })
}
