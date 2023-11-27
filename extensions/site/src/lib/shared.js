import {
  S3,
  GetBucketWebsiteCommand,
  HeadBucketCommand,
  CreateBucketCommand,
  ListObjectsCommand,
  PutObjectCommand,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  PutBucketPolicyCommand,
  PutBucketCorsCommand,
  PutBucketWebsiteCommand,
  PutPublicAccessBlockCommand
} from '@aws-sdk/client-s3'
import {
  CloudFront,
  CreateDistributionCommand,
  GetDistributionCommand,
  GetDistributionConfigCommand,
  UpdateDistributionCommand,
  DeleteDistributionCommand,
  CreateInvalidationCommand
} from '@aws-sdk/client-cloudfront'
import {
  Route53,
  ListHostedZonesByNameCommand,
  ListResourceRecordSetsCommand,
  GetHostedZoneCommand,
  CreateHostedZoneCommand,
  ChangeResourceRecordSetsCommand
} from '@aws-sdk/client-route-53'
import {
  ACM,
  RequestCertificateCommand,
  DescribeCertificateCommand,
  ListCertificatesCommand
} from '@aws-sdk/client-acm'
import * as fs from 'fs'
import * as path from 'path'
import klawSync from 'klaw-sync'
import mime from 'mime-types'
import { parseDomain, fromUrl } from 'parse-domain'
import { customAlphabet } from 'nanoid'

const sleep = async (wait) => {
  await new Promise((resolve) => setTimeout(resolve, wait))
}

const generateId = () => {
  const nanoid = customAlphabet('1234567890abcdef', 8)
  return nanoid()
}

/**
 * Validates a domain name and checks if it only contains the domain without paths.
 * @param {string} domain - The domain name to validate.
 * @returns {boolean} - Returns true if the domain is valid and has no paths.
 * @throws {Error} - Throws an error if the domain is invalid or contains paths.
 */
const validateDomain = (domain) => {
  try {
    const parsedDomain = parseDomain(fromUrl(domain))

    // Check if the domain is valid
    if (parsedDomain.type !== 'LISTED' || parsedDomain.domain === null || parsedDomain.topLevelDomains.length === 0) {
      throw new Error('Invalid domain format.')
    }

    // Check for additional path segments
    const urlObject = new URL(domain.startsWith('http') ? domain : `http://${domain}`)
    if (urlObject.pathname !== '/' || urlObject.search !== '' || urlObject.hash !== '') {
      throw new Error('Domain must not contain paths, query strings, or fragments.')
    }

    return true
  } catch (error) {
    throw new Error(`Domain validation error: ${error.message}`)
  }
}

/**
 * Get AWS SDK clients
 * @param credentials
 * @param region
 * @returns
 */
const getAwsSdkClients = (credentials = {}, region) => {
  if (!credentials.accessKeyId ||
    credentials.accessKeyId.length === 0 ||
    !credentials.secretAccessKey ||
        credentials.secretAccessKey.length === 0) {
    const msg = 'AWS credentials not found'
    throw new Error(msg)
  }

  const s3 = new S3({ credentials, region })
  const cf = new CloudFront({ credentials, region })
  const route53 = new Route53({ credentials, region })
  const acm = new ACM({ credentials, region: 'us-east-1' }) // ACM must be in us-east-1

  return { s3, cf, route53, acm }
}

/**
 * Get the config for the extension.
 * This is a combination of the inputs, state and defaults.
 * @param inputs
 * @param state
 * @returns
 */
const getConfig = ({
  instanceName = null,
  config = {},
  state = {}
}) => {
  // Defaults
  const fullConfig = {
    aws: {}
  }
  if (!config.aws) {
    config.aws = {}
  }
  config.aws.region = config.aws.region ? config.aws.region : (state.aws.region ? state.aws.region : 'us-east-1')

  /**
   * Validations
   */
  // Check if region is attempting to be changed
  if (state?.aws?.region && state.aws.region !== config.aws?.region) {
    throw new Error(
        `Changing the region from ${state.aws.region} to ${config.aws.region} is not allowed due to it being a breaking change. Tear down this Extension and re-deploy with the new region.`
    )
  }
  // Check if S3 bucket name is attempting to be changed
  if ((state?.aws?.s3BucketName && config.aws?.s3BucketName) && state.aws.s3BucketName !== config.aws?.s3BucketName) {
    throw new Error(
      `Changing the bucket name from ${state.aws.s3BucketName} to ${config.aws.s3BucketName} is not allowed due to it being a breaking change. Tear down this Extension and re-deploy with the new bucket name.`
    )
  }
  // Check if domain is attempting to be changed
  if (config.domain && state.domain && state.domain !== config.domain) {
    throw new Error(
        `Changing the domain from ${state.domain} to ${config.domain} is not allowed due to it being a breaking change. Tear down this Extension and re-deploy with the new domain name.`
    )
  }

  /**
   * General
   */
  // Ensure src path works with Docker and exists
  if (config.src) {
    fullConfig.src = path.join('/workspace', config.src)
    try {
      fs.statSync(fullConfig.src)
    } catch (error) {
      throw new Error(`The "src" path "${fullConfig.src.replace(/^\/workspace/, '')}" does not exist. Please check your configuration in ext.yml and your directory structure.`)
    }
  }
  fullConfig.domain = typeof config.domain === 'string' ? config.domain.replace('https://', '').replace('http://', '') : null
  if (fullConfig.domain) {
    validateDomain(fullConfig.domain)
  }

  /**
   * AWS S3
   */
  if (state?.aws?.s3BucketName) {
    fullConfig.aws.s3BucketName = state.aws.s3BucketName
  } else {
    if (config.aws?.s3BucketName) {
      fullConfig.aws.s3BucketName = config.aws.s3BucketName
    } else if (config.domain) {
      fullConfig.aws.s3BucketName = config.domain
    } else {
      fullConfig.aws.s3BucketName = `website-${instanceName.toLowerCase()}-${generateId()}`
    }
  }
  fullConfig.aws.s3IndexFile = config.aws.s3IndexFile ?? 'index.html'
  fullConfig.aws.s3ErrorFile = config.aws.s3ErrorFile ?? 'index.html'
  fullConfig.aws.region = state?.aws?.region ?? config?.aws?.region ?? 'us-east-1'
  fullConfig.aws.s3BucketWebsiteUrl = state?.aws?.s3BucketWebsiteUrl ?? null

  /**
   * AWS CloudFront
   */
  fullConfig.aws.cloudfrontDistributionId = state?.aws?.cloudfrontDistributionId ?? null
  fullConfig.aws.cloudfrontDistributionUrl = state?.aws?.cloudfrontDistributionUrl ?? null
  fullConfig.aws.cloudfrontDistributionArn = state.aws?.cloudfrontDistributionArn ?? null
  fullConfig.aws.cloudfrontDistributionDescription = config?.aws?.cloudfrontDistributionDescription ?? `${fullConfig.aws.s3BucketName} - Distribution for bucket "${fullConfig.aws.s3BucketName}"`

  /**
   * AWS Route53
   */
  fullConfig.aws.route53DomainHostedZoneId = typeof fullConfig.domain === 'string' ? state?.aws?.route53DomainHostedZoneId : null

  /**
   * AWS ACM
   */
  fullConfig.aws.acmCertificateArn = state?.aws?.acmCertificateArn

  return fullConfig
}

/**
 * Create AWS S3 Bucket
 * @param {*} clients
 * @param {*} Bucket
 * @returns
 */
const createS3Bucket = async (clients, Bucket) => {
  try {
    await clients.s3.send(new HeadBucketCommand({ Bucket }))
  } catch (e) {
    if (e.name === 'NotFound' || e.name === 'NoSuchBucket') {
      await sleep(2000)
      await createS3Bucket(clients, Bucket); return
    }
    throw e
  }
}

/**
 * Find or create AWS S3 Bucket
 * @param {*} clients
 * @param {*} awsS3BucketName
 */
const findOrCreateS3Bucket = async (clients, awsS3BucketName) => {
  try {
    // log(`Checking if bucket ${awsS3BucketName} exists.`)
    await clients.s3.send(new HeadBucketCommand({ Bucket: awsS3BucketName }))
  } catch (e) {
    if (e.name === 'NotFound') {
      //   log(`Bucket ${awsS3BucketName} does not exist. Creating...`)
      await clients.s3.send(new CreateBucketCommand({ Bucket: awsS3BucketName }))
      //   log(`Bucket ${awsS3BucketName} created. Confirming it's ready...`)
      await createS3Bucket(clients, awsS3BucketName)
    } else if (e.name === 'Forbidden' && e.message === null) {
      throw new Error('Forbidden: Invalid credentials or this AWS S3 bucket name may already be taken')
    } else if (e.name === 'Forbidden') {
      throw new Error(`Bucket name "${awsS3BucketName}" is already taken.`)
    } else {
      throw e
    }
  }
}

/**
 * Con
 * @returns
 */
const configureAwsS3BucketForHosting = async ({
  clients,
  bucketName,
  indexDocument,
  errorDocument
}) => {
  // Attempt to retrieve the current bucket website configuration
  let currentConfig
  try {
    const currentConfigResponse = await clients.s3.send(new GetBucketWebsiteCommand({ Bucket: bucketName }))
    currentConfig = currentConfigResponse.WebsiteConfiguration
  } catch (e) {
    if (e.name !== 'NoSuchWebsiteConfiguration') {
      // If the error is not about missing configuration, rethrow it
      throw e
    }
    // No existing website configuration
    currentConfig = null
  }

  // Define desired website configuration
  const desiredConfig = {
    ErrorDocument: {
      Key: errorDocument
    },
    IndexDocument: {
      Suffix: indexDocument
    }
  }

  // Check if the current configuration matches the desired configuration
  if (JSON.stringify(currentConfig) === JSON.stringify(desiredConfig)) {
    // Configuration is already correct, exit the function
    return
  }

  // Define S3 bucket policy
  const s3BucketPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: {
          AWS: '*'
        },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucketName}/*`]
      }
    ]
  }

  // Configuration for static hosting
  const staticHostParams = {
    Bucket: bucketName,
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: errorDocument
      },
      IndexDocument: {
        Suffix: indexDocument
      }
    }
  }

  // Define CORS rules
  const putPostDeleteHeadRule = {
    AllowedMethods: ['PUT', 'POST', 'DELETE', 'HEAD'],
    AllowedOrigins: ['https://*.amazonaws.com'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 0
  }
  const getRule = {
    AllowedMethods: ['GET'],
    AllowedOrigins: ['*'],
    AllowedHeaders: ['*'],
    MaxAgeSeconds: 0
  }

  try {
    // Disabling block public access settings
    await clients.s3.send(new PutPublicAccessBlockCommand({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: false,
        IgnorePublicAcls: false,
        BlockPublicPolicy: false,
        RestrictPublicBuckets: false
      }
    }))

    // Applying the bucket policy
    await clients.s3.send(new PutBucketPolicyCommand({
      Bucket: bucketName,
      Policy: JSON.stringify(s3BucketPolicy)
    }))

    // Setting CORS configuration
    await clients.s3.send(new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [putPostDeleteHeadRule, getRule]
      }
    }))

    // Setting the bucket website configuration
    await clients.s3.send(new PutBucketWebsiteCommand(staticHostParams))
  } catch (e) {
    if (e.name === 'NoSuchBucket') {
      // Handle the NoSuchBucket exception
      await sleep(2000) // Ensure 'sleep' function is defined or use another retry logic
      return configureAwsS3BucketForHosting({ clients, bucketName, indexDocument, errorDocument })
    }
    throw e
  }
}

/**
 * Check if the directory exists
 * @param {string} dirPath - Path to the directory
 * @returns {boolean}
 */
const directoryExists = (dirPath) => {
  if (!dirPath) { return false }
  try {
    return fs.statSync(dirPath).isDirectory()
  } catch (err) {
    return false
  }
}

/**
 * Uploads a default HTML file to S3 bucket
 * @param {*} clients - AWS clients
 * @param {*} awsS3BucketName - S3 Bucket name
 */
const uploadDefaultHTML = async (clients, awsS3BucketName) => {
  const defaultHtml = `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Extension</title>
      <style>
          .centered-content {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-family: sans-serif, arial;
              font-size: 16px;
          }
      </style>
  </head>
  <body>
      <div class="centered-content">
          <h1>Welcome to the Website Extension.</h1>
      </div>
  </body>
  </html>`

  const params = {
    Bucket: awsS3BucketName,
    Key: 'index.html', // Default file name
    Body: defaultHtml,
    ContentType: 'text/html'
  }

  return await clients.s3.send(new PutObjectCommand(params))
}

/**
 * Upload directory to AWS S3 Bucket. If directory doesn't exist, uploads a default HTML file
 * @param {*} clients - AWS clients
 * @param {*} awsS3BucketName - S3 Bucket name
 * @param {*} dirPath - Directory path
 */
const uploadDir = async (clients, awsS3BucketName, dirPath) => {
  if (!dirPath || !directoryExists(dirPath)) {
    return await uploadDefaultHTML(clients, awsS3BucketName)
  }

  const items = klawSync(dirPath, { nodir: true })

  const uploadItems = items.map(async item => {
    let key = path.relative(dirPath, item.path)
    if (path.sep === '\\') {
      key = key.replace(/\\/g, '/')
    }

    const params = {
      Bucket: awsS3BucketName,
      Key: key,
      Body: fs.readFileSync(item.path),
      ContentType: mime.lookup(path.basename(item.path)) || 'application/octet-stream'
    }

    return await clients.s3.send(new PutObjectCommand(params))
  })

  await Promise.all(uploadItems)
}

/**
 * Gets the Hosted Zone ID and nameservers for a domain. If it doesn't exist, creates a new Hosted Zone.
 * @param {object} clients - An object containing AWS SDK clients.
 * @param {string} domain - The domain name for which to find or create a hosted zone.
 * @returns {object} An object containing the hosted zone ID and nameservers.
 */
const findOrCreateRoute53HostedZone = async (clients, domain) => {
  const hostedZonesRes = await clients.route53.send(new ListHostedZonesByNameCommand({}))
  let hostedZone = hostedZonesRes.HostedZones.find(zone => zone.Name.includes(domain))
  let createdByExtension = false

  // If the hosted zone does not exist, create one
  if (!hostedZone) {
    const createZoneRes = await clients.route53.send(
      new CreateHostedZoneCommand({
        Name: domain,
        CallerReference: `create-hosted-zone-${new Date().getTime()}` // Unique string to ensure idempotency
      })
    )
    hostedZone = createZoneRes.HostedZone
    createdByExtension = true
  }

  // Get details of the hosted zone, including nameservers
  const hostedZoneDetails = await clients.route53.send(
    new GetHostedZoneCommand({
      Id: hostedZone.Id
    })
  )

  return {
    createdByExtension,
    hostedZoneId: hostedZone.Id.replace('/hostedzone/', ''),
    nameservers: hostedZoneDetails.DelegationSet.NameServers
  }
}

/**
 * Ensures an ACM certificate is available for the given domain.
 * Automatically creates the necessary DNS validation records in Route 53,
 * retries if the records are not available immediately.
 * @param {object} clients - An object containing AWS SDK clients.
 * @param {string} domain - The domain name for which to ensure a certificate.
 * @param {string} route53DomainHostedZoneId - The hosted zone ID in Route 53.
 * @returns {Promise<{certificateArn: string|null, created: boolean}>} The ARN of the certificate and creation status.
 */
const findOrCreateAcmCertificate = async (clients, domain, route53DomainHostedZoneId) => {
  let created = false

  const listRes = await clients.acm.send(new ListCertificatesCommand({}))
  const certificate = listRes.CertificateSummaryList?.find(cert =>
    cert.DomainName === domain || (cert.SubjectAlternativeNames && cert.SubjectAlternativeNames.includes(domain))
  )
  let certificateArn = certificate?.CertificateArn

  if (!certificateArn) {
    const certificateRes = await clients.acm.send(new RequestCertificateCommand({
      DomainName: domain,
      ValidationMethod: 'DNS',
      SubjectAlternativeNames: [domain]
    }))
    certificateArn = certificateRes.CertificateArn
    created = true

    // Wait for certificate to be issued
    await sleep(10000)
  }

  let dnsRecordCreated = false
  let statusCheckAttempts = 0
  const maxStatusCheckAttempts = 10

  while (statusCheckAttempts < maxStatusCheckAttempts) {
    const describeRes = await clients.acm.send(new DescribeCertificateCommand({ CertificateArn: certificateArn }))
    const currentStatus = describeRes.Certificate.Status

    if (!dnsRecordCreated && currentStatus === 'PENDING_VALIDATION' &&
          describeRes.Certificate?.DomainValidationOptions &&
          describeRes.Certificate?.DomainValidationOptions.length > 0 &&
          describeRes.Certificate?.DomainValidationOptions[0]?.ResourceRecord) {
      const resourceRecord = describeRes.Certificate.DomainValidationOptions[0].ResourceRecord

      await clients.route53.send(new ChangeResourceRecordSetsCommand({
        HostedZoneId: route53DomainHostedZoneId,
        ChangeBatch: {
          Changes: [{
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: resourceRecord.Name,
              Type: resourceRecord.Type,
              TTL: 300,
              ResourceRecords: [{ Value: resourceRecord.Value }]
            }
          }]
        }
      }))

      dnsRecordCreated = true
    }

    if (currentStatus !== 'PENDING_VALIDATION') {
      break
    }

    await sleep(25000)
    statusCheckAttempts++
  }

  return { certificateArn, created }
}

/**
 * Create CloudFront distribution
 * @param {*} clients
 * @param {*} cloudfrontDistributionDescription
 * @param {*} s3BucketName
 * @param {*} s3BucketWebsiteUrl
 * @param {*} acmCertificateArn
 * @returns
 */
const createCloudFrontDistribution = async (
  clients,
  cloudfrontDistributionDescription,
  s3BucketName,
  s3BucketWebsiteUrl) => {
  const distributionConfig = {
    CallerReference: String(Date.now()),
    DefaultRootObject: 'index.html',
    CustomErrorResponses: {
      Quantity: 2,
      Items: [
        {
          ErrorCode: 404,
          ErrorCachingMinTTL: 300,
          ResponseCode: '200',
          ResponsePagePath: '/index.html'
        },
        {
          ErrorCode: 403,
          ErrorCachingMinTTL: 300,
          ResponseCode: '200',
          ResponsePagePath: '/index.html'
        }
      ]
    },
    Comment: cloudfrontDistributionDescription,
    Aliases: {
      Quantity: 0,
      Items: []
    },
    PriceClass: 'PriceClass_All',
    Enabled: true,
    HttpVersion: 'http2',
    Origins: {
      Quantity: 1,
      Items: [
        // AWS recommends using CustomOriginConfig for S3 buckets now, rather than S3OriginConfig (shrug)
        {
          Id: s3BucketName,
          DomainName: s3BucketWebsiteUrl,
          CustomHeaders: {
            Quantity: 0
          },
          CustomOriginConfig: {
            HTTPPort: 80,
            HTTPSPort: 443,
            OriginProtocolPolicy: 'http-only',
            OriginSslProtocols: {
              Quantity: 1,
              Items: ['TLSv1.2']
            },
            OriginReadTimeout: 30,
            OriginKeepaliveTimeout: 5
          },
          ConnectionAttempts: 3,
          ConnectionTimeout: 10,
          OriginShield: {
            Enabled: false
          }
        }
      ]
    },
    DefaultCacheBehavior: {
      TargetOriginId: s3BucketName,
      ForwardedValues: {
        QueryString: false,
        Cookies: {
          Forward: 'none'
        },
        Headers: {
          Quantity: 0,
          Items: []
        },
        QueryStringCacheKeys: {
          Quantity: 0,
          Items: []
        }
      },
      TrustedSigners: {
        Enabled: false,
        Quantity: 0,
        Items: []
      },
      ViewerProtocolPolicy: 'redirect-to-https',
      MinTTL: 0,
      AllowedMethods: {
        Quantity: 2,
        Items: ['HEAD', 'GET'],
        CachedMethods: {
          Quantity: 2,
          Items: ['HEAD', 'GET']
        }
      },
      SmoothStreaming: false,
      DefaultTTL: 0,
      MaxTTL: 31536000,
      Compress: false,
      LambdaFunctionAssociations: {
        Quantity: 0,
        Items: []
      },
      FieldLevelEncryptionId: ''
    },
    CacheBehaviors: {
      Quantity: 0,
      Items: []
    }
  }

  const distributionRes = await clients.cf.send(new CreateDistributionCommand({
    DistributionConfig: distributionConfig
  }))

  return {
    cloudfrontDistributionArn: distributionRes.Distribution.ARN,
    cloudfrontDistributionId: distributionRes.Distribution.Id,
    cloudfrontDistributionUrl: distributionRes.Distribution.DomainName
  }
}

/**
 * Ensure CloudFront distribution is enabled and properly configured
 * @param {*} clients
 * @param {*} cloudfrontDistributionId
 * @param {*} domain - Optional domain to add to alternate domain names
 * @param {*} acmCertificateArn - Optional ACM certificate ARN to set in distribution
 * @returns
 */
const ensureCloudFrontDistributionConfigured = async (
  clients,
  cloudfrontDistributionId,
  domain,
  acmCertificateArn
) => {
  // Track if Cloudfront needs updating
  let needsUpdate = false

  // Fetch the current configuration of the distribution
  const cfDistribution = await clients.cf.send(new GetDistributionConfigCommand({
    Id: cloudfrontDistributionId
  }))
  const distributionConfig = cfDistribution.DistributionConfig

  // Check and update distribution 'Enabled' status
  if (!distributionConfig.Enabled) {
    distributionConfig.Enabled = true
    needsUpdate = true
  }

  // Initialize Aliases if they don't exist
  if (!distributionConfig.Aliases) {
    distributionConfig.Aliases = { Quantity: 0, Items: [] }
  } else if (!distributionConfig.Aliases.Items) {
    distributionConfig.Aliases.Items = []
  }

  // Update alternate domain names if a domain is provided and not already included
  if (domain && !distributionConfig.Aliases.Items.includes(domain)) {
    distributionConfig.Aliases.Items.push(domain)
    distributionConfig.Aliases.Quantity += 1
    needsUpdate = true
  }

  // Update ACM certificate if provided and different from the current one
  const viewerCertificate = distributionConfig.ViewerCertificate
  if (acmCertificateArn &&
      (!viewerCertificate.ACMCertificateArn ||
        viewerCertificate.ACMCertificateArn !== acmCertificateArn)) {
    distributionConfig.ViewerCertificate = {
      ACMCertificateArn: acmCertificateArn,
      SSLSupportMethod: 'sni-only',
      MinimumProtocolVersion: 'TLSv1.1_2016'
    }
    needsUpdate = true
  }

  // Update distribution with retry on specific error
  if (needsUpdate) {
    const maxRetries = 3
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await clients.cf.send(new UpdateDistributionCommand({
          Id: cloudfrontDistributionId,
          DistributionConfig: distributionConfig,
          IfMatch: cfDistribution.ETag
        }))
        break // Break loop if update succeeds
      } catch (error) {
        if (error.Code === 'InvalidViewerCertificate' && attempt < maxRetries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 30000) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error // Rethrow error if not the specific one or max retries reached
        }
      }
    }
  }

  return { distributionUpdated: needsUpdate }
}

/**
 * Invalidate CloudFront distribution
 * @param {*} clients
 * @param {*} cloudfrontDistributionId
 */
const invalidateCloudFrontDistribution = async (clients, cloudfrontDistributionId) => {
  await clients.cf.send(new CreateInvalidationCommand({
    DistributionId: cloudfrontDistributionId,
    InvalidationBatch: {
      CallerReference: `invalidate-${Date.now()}`,
      Paths: {
        Quantity: 1,
        Items: ['/*']
      }
    }
  }))
}

/**
 * Configure Cloudfront distribution to Route53 Hosted Zone
 * @param {*} clients
 * @param {*} domain
 * @param {*} cloudfrontDistributionUrl
 * @param {*} route53DomainHostedZoneId
 */
const configureAddCloudFrontDnsToHostedZone = async (
  clients,
  domain,
  cloudfrontDistributionUrl,
  route53DomainHostedZoneId) => {
  const changeBatch = {
    Changes: [{
      Action: 'UPSERT',
      ResourceRecordSet: {
        Name: domain,
        Type: 'A',
        AliasTarget: {
          HostedZoneId: 'Z2FDTNDATAQYW2', // CloudFront Hosted Zone ID
          DNSName: cloudfrontDistributionUrl,
          EvaluateTargetHealth: false
        }
      }
    }]
  }

  await clients.route53.send(new ChangeResourceRecordSetsCommand({
    HostedZoneId: route53DomainHostedZoneId,
    ChangeBatch: changeBatch
  }))
}

/**
 * Fetch ACM Certificate Validation Record
 * @param {*} clients - AWS SDK clients
 * @param {*} acmCertificateArn - ACM Certificate ARN
 * @returns {object|null} - Returns the validation CNAME record or null if not found
 */
const fetchAcmCertificateValidationRecord = async (clients, acmCertificateArn) => {
  try {
    const describeRes = await clients.acm.send(new DescribeCertificateCommand({ CertificateArn: acmCertificateArn }))
    const validationOptions = describeRes.Certificate.DomainValidationOptions

    for (const option of validationOptions) {
      if (option.ResourceRecord && option.ResourceRecord.Type === 'CNAME') {
        return option.ResourceRecord
      }
    }
  } catch (error) {
    console.error('Error fetching ACM certificate validation record:', error)
    throw error
  }
  return null
}

/**
 * Remove DNS Record from Route 53
 * @param {*} clients - AWS SDK clients
 * @param {*} hostedZoneId - Route 53 Hosted Zone ID
 * @param {*} record - DNS record to remove
 */
const removeRoute53DnsRecord = async (clients, hostedZoneId, record) => {
  try {
    if (!record) {
      console.log('No DNS record provided. Skipping deletion.')
      return
    }

    // Define the change batch to remove DNS record
    const changeBatch = {
      Changes: [{
        Action: 'DELETE',
        ResourceRecordSet: {
          Name: record.Name,
          Type: record.Type,
          TTL: 300, // Use the same TTL as set during creation
          ResourceRecords: [{ Value: record.Value }]
        }
      }]
    }

    // Remove DNS record
    await clients.route53.send(new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: changeBatch
    }))
  } catch (error) {
    if (error.name === 'InvalidChangeBatch') {
      console.log('Invalid change batch for DNS records. Skipping deletion.')
    } else {
      throw error
    }
  }
}

/**
 * Remove Route 53 DNS Records for CloudFront
 * @param {*} clients - AWS SDK clients
 * @param {*} domain - Domain name
 * @param {*} route53DomainHostedZoneId - Route 53 Hosted Zone ID
 */
const removeRoute53RecordsForCloudFront = async (
  clients,
  domain,
  route53DomainHostedZoneId,
  cloudfrontDistributionUrl) => {
  // Check if the DNS record exists
  const { ResourceRecordSets } = await clients.route53.send(new ListResourceRecordSetsCommand({
    HostedZoneId: route53DomainHostedZoneId
  }))

  const recordSet = ResourceRecordSets.find(record => record.Name.includes(domain) && record.Type === 'A')

  if (!recordSet ||
    !recordSet.AliasTarget ||
    !recordSet.AliasTarget.DNSName.includes(cloudfrontDistributionUrl)) {
    return recordSet
  }

  // Define the change batch to remove DNS records
  const changeBatch = {
    Changes: [{
      Action: 'DELETE',
      ResourceRecordSet: recordSet
    }]
  }

  // Remove DNS records
  await clients.route53.send(new ChangeResourceRecordSetsCommand({
    HostedZoneId: route53DomainHostedZoneId,
    ChangeBatch: changeBatch
  }))
}

/**
 * Disable and Delete CloudFront Distribution
 * @param {*} clients - AWS SDK clients
 * @param {*} cloudfrontDistributionId - CloudFront Distribution ID
 */
const deleteCloudFrontDistribution = async (clients, cloudfrontDistributionId) => {
  try {
    // Get the current distribution configuration
    const { DistributionConfig, ETag } = await clients.cf.send(new GetDistributionConfigCommand({
      Id: cloudfrontDistributionId
    }))

    // Disable the distribution if it's enabled
    if (DistributionConfig.Enabled) {
      DistributionConfig.Enabled = false
      await clients.cf.send(new UpdateDistributionCommand({
        Id: cloudfrontDistributionId,
        DistributionConfig,
        IfMatch: ETag
      }))
    }

    // Check every 30 seconds if the distribution is disabled and deployed
    let status = ''
    let enabled = true
    do {
      await new Promise(resolve => setTimeout(resolve, 30000)) // 30-second delay
      const { Distribution } = await clients.cf.send(new GetDistributionCommand({
        Id: cloudfrontDistributionId
      }))
      status = Distribution.Status
      enabled = Distribution.DistributionConfig.Enabled
    } while (status !== 'Deployed' || enabled)

    // Get the current distribution again, or the ETag will be invalid after deletion
    const { ETag: ETagNew } = await clients.cf.send(new GetDistributionConfigCommand({
      Id: cloudfrontDistributionId
    }))

    // Now delete the distribution
    await clients.cf.send(new DeleteDistributionCommand({
      Id: cloudfrontDistributionId,
      IfMatch: ETagNew
    }))
  } catch (error) {
    if (error.name === 'NoSuchDistribution') {
      console.log('CloudFront distribution not found. Skipping deletion.')
    } else {
      throw error
    }
  }
}

/**
 * Empty and Delete S3 Bucket
 * @param {*} clients - AWS SDK clients
 * @param {*} bucketName - S3 Bucket name
 */
const deleteS3Bucket = async (clients, bucketName) => {
  try {
    // List and delete all objects in the bucket
    const { Contents } = await clients.s3.send(new ListObjectsCommand({ Bucket: bucketName }))
    if (Contents.length > 0) {
      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: Contents.map(({ Key }) => ({ Key }))
        }
      }
      await clients.s3.send(new DeleteObjectsCommand(deleteParams))
    }

    // Delete the bucket
    await clients.s3.send(new DeleteBucketCommand({ Bucket: bucketName }))
  } catch (error) {
    if (error.name === 'NoSuchBucket') {
      // If the bucket is not found, fail silently
    } else {
      throw error
    }
  }
}

export {
  getAwsSdkClients,
  getConfig,
  findOrCreateS3Bucket,
  configureAwsS3BucketForHosting,
  uploadDir,
  findOrCreateRoute53HostedZone,
  findOrCreateAcmCertificate,
  createCloudFrontDistribution,
  ensureCloudFrontDistributionConfigured,
  invalidateCloudFrontDistribution,
  configureAddCloudFrontDnsToHostedZone,
  deleteCloudFrontDistribution,
  deleteS3Bucket,
  fetchAcmCertificateValidationRecord,
  removeRoute53RecordsForCloudFront,
  removeRoute53DnsRecord
}
