# Site

This EXT Extension streamlines static website deployment and hosting on AWS, offering you one of the cheapest and most performant ways of hosting a website. It does this via services like S3, Cloudfront, ACM, and Route53. Deploy your site with a single command, enjoying powerful automation and deployment times as quick as 2 seconds, while benefiting from the affordability of these AWS services.

## Features

* **Effortless Setup**: Initiate deployment without any initial configuration. Seamlessly add additional configuration as needed later.
* **Rapid Deployment**: Experience swift deployments of your entire website or frontend, typically within approximately 2 seconds, subject to the number of files and your internet connection speed.
* **Secure SSL Integration**: Automatically deploy and configure a complimentary SSL certificate for your custom domain through AWS ACM, ensuring secure connections.

## Configuration

| Option | Required | Default | Description |
| ------ | -------- | ------- | ----------- |
| src | no | null | The relative path to the source code of your website. This will likely either be `./src` or `./dist` if you build your website. |
| domain | no | null | A custom domain to configure with your website. This can be in Route53 or on an external registrar. Learn more by reading the section on custom domains. |
| aws.region | no | null | The region you want your site deployed to. Please note that some resources must be created in us-east-1, like your AWS ACM SSL Certificate |
| aws.s3BucketName | no | null | A custom name for the AWS S3 bucket. Please note that it is recommended to name your bucket as your domain. If you enter a `domain` as part of your configuration, that will be used as the bucket name (this is highly recommended). Otherwise, without a custom name, a randomly generated name will be created. |

## Actions

| Action | Description |
| ------- | ----------- |
| run | Deploys the required infrastructre, ensures it's connected to your custom domain with an SSL certificate, and uploads your source code. |
| info | Returns the outputs, containing useful information about your deployed website. |
| remove | Removes all infrastructre along with your source code. |


## Custom Domains

This extension handles domain configuration out of the box, whether you have no domain, use Route 53, or an external registrar. If your domain is with an external registrar, use the exported nameservers and Route 53 hosted zone details to update your external domain's nameserver settings.

This extension won't register a domain on Route53 to avoid unwarranted costs; domain registration should be done explicitly by you.

## Cost Estimate

Here are the estimated monthly costs for hosting a static website on AWS S3 and CloudFront, based on different levels of traffic.

For simplicity, we'll assume the website is fairly lightweight and each page view requires about 1 MB of data transfer. We'll consider four different scenarios based on monthly page views:

* Small (10,000 page views)
* Medium (100,000 page views)
* Large (1,000,000 page views)
* Extra Large (10,000,000 page views)

| Traffic Level  | S3 Storage Cost | S3 Request Cost | S3 Data Transfer Cost | CloudFront Data Transfer Cost | CloudFront Request Cost | Total Estimated Cost |
|----------------|-----------------|-----------------|-----------------------|-------------------------------|-------------------------|----------------------|
| Small          | $0.01           | $0.00           | $0.88                 | $0.83                         | $0.01                   | $1.73                |
| Medium         | $0.01           | $0.04           | $8.79                 | $8.30                         | $0.07                   | $17.22               |
| Large          | $0.01           | $0.40           | $87.89                | $83.01                        | $0.75                   | $172.06              |
| Extra Large    | $0.01           | $4.00           | $878.91               | $830.08                       | $7.50                   | $1720.50             |

These estimates are based on the assumption that each page view requires about 1 MB of data transfer and the website content is around 500 MB in size. Keep in mind that these are approximate figures and actual costs can vary based on exact usage patterns, AWS region, and changes in AWS pricing.