/**
 * Extension Action: Run
 *
 * This is the default action for your extension.
 * It is best used for deploying a use-case or running a script.
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
  getConfig,
  getAwsSdkClients,
  findOrCreateS3Bucket,
  configureAwsS3BucketForHosting,
  ensureCloudFrontDistributionConfigured,
  invalidateCloudFrontDistribution,
  createCloudFrontDistribution,
  findOrCreateRoute53HostedZone,
  findOrCreateAcmCertificate,
  configureAddCloudFrontDnsToHostedZone,
  uploadDir
} from '../shared.js'

export default async (execData = {}) => {
  /**
   * Initialization
   */
  await Logger.debug('Running the "run" action')

  // Track if Cloudfront distribution is being created/updated to show a message to the user
  let cloudfrontDistributionIsBeingUpdated = false

  // Get credentials
  const credentials = await GetCredentials(CredentialVendor.AWS)

  // Get state
  const state = await GetState() || {}
  state.aws = state.aws ?? {}

  // Merge config for update
  const config = getConfig({
    instanceName: execData.instanceName,
    config: execData.config,
    state
  })

  // Get AWS SDK Clients
  const clients = getAwsSdkClients(credentials, config.aws.region)

  // Ensure region is stored in state
  state.aws.region = config.aws.region
  await StoreState(state)

  /**
   * Find or create AWS S3 bucket
   */
  await Logger.debug('Finding or creating AWS S3 bucket')
  await findOrCreateS3Bucket(clients, config.aws.s3BucketName)
  state.aws.s3BucketName = config.aws.s3BucketName
  await StoreState(state)

  /**
   * Ensure AWS S3 bucket is configured for hosting & upload files
   */
  if (!state.aws.s3BucketConfiguredForHosting) {
    await Logger.debug('Configuring AWS S3 bucket for hosting and uploading files')
    await Promise.all([
      configureAwsS3BucketForHosting({
        clients,
        bucketName: config.aws.s3BucketName,
        indexDocument: config.aws.s3IndexFile,
        errorDocument: config.aws.s3ErrorFile
      }),
      uploadDir(clients, config.aws.s3BucketName, config.src)
    ])
    state.aws.s3BucketConfiguredForHosting = true
    // Note: Older buckets will have a "." before region. AWS deprecated this and is moving to "s3-website-<region>"
    state.aws.s3BucketWebsiteUrl = `${state.aws.s3BucketName}.s3-website-${state.aws.region}.amazonaws.com`
    await StoreState(state)
  } else {
    await Logger.debug('Uploading files to AWS S3 bucket')
    await uploadDir(clients, config.aws.s3BucketName, config.src)
  }

  /**
   * Create CloudFront distribution if it doesn't exist
   */
  if (!state.aws.cloudfrontDistributionId ||
    !state.aws.cloudfrontDistributionUrl) {
    await Logger.debug('Creating AWS CloudFront distribution')
    const cfDistribution = await createCloudFrontDistribution(
      clients,
      config.aws.cloudfrontDistributionDescription,
      config.aws.s3BucketName,
      state.aws.s3BucketWebsiteUrl)
    state.aws.cloudfrontDistributionId = cfDistribution.cloudfrontDistributionId
    state.aws.cloudfrontDistributionUrl = cfDistribution.cloudfrontDistributionUrl
    state.aws.cloudfrontDistributionArn = cfDistribution.cloudfrontDistributionArn
    await StoreState(state)
    cloudfrontDistributionIsBeingUpdated = true
  }

  /**
   * Handle Domain operations first, which includes
   * creating a Route53 hosted zone, ACM certificate, etc.
   */
  if (config.domain) {
    // Ensure domain is stored in state
    state.domain = config.domain
    await StoreState(state)

    // Find or create Route53 hosted zone
    await Logger.debug('Finding or creating AWS Route53 hosted zone')
    const resHostedZone = await findOrCreateRoute53HostedZone(
      clients,
      config.domain,
      state.aws.route53HostedZoneCreatedByExtension)
    state.aws.route53HostedZoneId = resHostedZone.hostedZoneId
    state.aws.route53HostedZoneCreatedByExtension = resHostedZone.createdByExtension
    state.aws.route53HostedZoneNameservers = resHostedZone.nameservers
    await StoreState(state)

    // Find or Create ACM certificate
    await Logger.debug('Finding or creating AWS ACM certificate')
    const resAcmCert = await findOrCreateAcmCertificate(
      clients,
      state.domain,
      state.aws.route53HostedZoneId)
    state.aws.acmCertificateArn = resAcmCert.certificateArn
    await StoreState(state)

    // Add CloudFront DNS to Route53 hosted zone
    await Logger.debug('Configuring AWS Route53 hosted zone for CloudFront distribution')
    await configureAddCloudFrontDnsToHostedZone(
      clients,
      state.domain,
      state.aws.cloudfrontDistributionUrl,
      state.aws.route53HostedZoneId)
  }

  /**
   * Ensure CloudFront distribution is correctly configured w/ domain, ACM certificate, etc.
   */
  await Logger.debug('Ensuring AWS CloudFront distribution is correctly configured')
  try {
    const resEnsureCloudfrontConfig = await ensureCloudFrontDistributionConfigured(
      clients,
      state.aws.cloudfrontDistributionId,
      state.domain,
      state.aws.acmCertificateArn
    )

    if (resEnsureCloudfrontConfig.cloudfrontUpdated) {
      cloudfrontDistributionIsBeingUpdated = true
    }
  } catch (error) {
    if (error.Code === 'InvalidViewerCertificate') {
      await Logger.warning('Failed to configure your ACM SSL certificate for your CloudFront distribution. This may be because your AWS ACM SSL Certificate is not yet valid due to you using an external DNS service (other than AWS Route53), and that has not been pointed toward the Route53 Hosted Zone. To fix, configure the domain on your external DNS service to use the Route53 Hosted Zone Nameservers exported in the outputs of this Extension. Then you will have to wait for DNS propagation to complete (which could take a few hours). The ACM Certificate will eventually turn into a VALID state. When that happens, run this again.')
    } else {
      throw error
    }
  }

  /**
   * Invalidate CloudFront distribution
   */
  await Logger.debug('Invalidating AWS CloudFront distribution')
  await invalidateCloudFrontDistribution(
    clients,
    state.aws.cloudfrontDistributionId,
    state.aws.s3BucketWebsiteUrl)

  /**
   * Warn user if Cloudfront distribution is being updated
   */
  if (cloudfrontDistributionIsBeingUpdated) {
    await Logger.info('The CloudFront distribution is being updated. This may take up to 15 minutes. Please use the AWS S3 Bucket URL to preview your website in the meantime, and try your custom domain again after 15 minutes.')
  }

  /**
   * Report execution result
   */
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
