import * as cdk from 'aws-cdk-lib';
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3Events from 'aws-cdk-lib/aws-s3-notifications';

export class AutomationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        //S3 Bucket
        const automationBucket = new s3.Bucket(this, 'automation-bucket');

        //Lambda function to trigger with s3 put object
        const automationLambda = new lambda.Function(this, 'automation-lambda', {
            runtime: lambda.Runtime.PYTHON_3_11,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'index.handler',
        }
        );

    }
}