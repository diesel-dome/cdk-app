import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';

import { BlockPublicAccess, BucketAccessControl } from 'aws-cdk-lib/aws-s3';

import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CdkAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // domain
    const domainName = 'jared-gordon.link';
    const siteDomain = 'www.' + domainName;

    // Find current hosted zone in Route 53
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {domainName: domainName});
    console.log(zone);

    // Create TLS/SSL certificate for HTTPS
    const certificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: domainName,
      subjectAlternativeNames: ['*.' + domainName],
      hostedZone: zone,
      region: 'us-east-1'});

    // Removal policy for TLS/SSL certificate
    certificate.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // Create S3 bucket for website
    const siteBucket = new s3.Bucket(this, 'WebSiteBucket', {
      bucketName: siteDomain,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'error/index.html'});

    new CfnOutput(this, 'Bucket', {value: siteBucket.bucketName});

    // Create CloudFront distribution for website
    const distribution = new cloudfront.Distribution(this, 'WebSiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [siteDomain, domainName],
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 403,
          responsePagePath: '/error/index.html',
          ttl: Duration.minutes(30),
        }
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(siteBucket),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      }
    });

    new CfnOutput(this, 'DistributionId', {value: distribution.distributionId});

    // Create a Route 53 alias record for the Cloudfront distribution
    new route53.ARecord(this, 'WWWSiteAliasRecord', {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone
    });

    // Add an 'A' record to Route 53 
    new route53.ARecord(this, 'SiteAliasRecord', {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    });

    // Deploy Files from website folder to S3 bucket
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('./website')],
      destinationBucket: siteBucket,
      cacheControl: [s3deploy.CacheControl.noCache()]
    });

  }
}
