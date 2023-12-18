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

        //Lambda function to trigger with s3 put object using Python 3.11 runtime
        const nameConventionLambda = new lambda.Function(this, 'name-convention-lambda', {
            runtime: lambda.Runtime.PYTHON_3_11,
            code: lambda.Code.fromAsset('lambda/name-convention'),
            handler: 'app.main',
        }
        );

        //Add S3 trigger to Lambda function with specific s3 key
        automationBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3Events.LambdaDestination(nameConventionLambda),
            { prefix: 'name-convetion/landing/' });

    }
}