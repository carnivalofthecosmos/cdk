import * as cdk from "@aws-cdk/core";

// export interface StackBuilderProps {
//   /**
//    * The visibility timeout to be configured on the SQS Queue, in seconds.
//    *
//    * @default Duration.seconds(300)
//    */
//   visibilityTimeout?: cdk.Duration;
// }

// export class StackBuilder extends cdk.Construct {
//   /** @returns the ARN of the SQS queue */
//   public readonly queueArn: string;

//   constructor(scope: cdk.Construct, id: string, props: StackBuilderProps = {}) {
//     super(scope, id);
//   }
// }

export interface StackBuilderSackProps extends cdk.StackProps {
  // bucketName: string;
  // s3StackPrefix: string;
  longDescription: string; //= 'This template is the nested stack engine and controller';
  project: string;
  version: string;
  application: string;
}

// TODO:  add metadata based on Context

export class StackBuilderStack extends cdk.Stack{
  constructor(scope: cdk.App, id: string, props: StackBuilderSackProps) {
    super(scope, id, props);

    this.templateOptions.description = `${props.project}/${props.application} - ${this.stackName} - ${props.version} - ${props.longDescription}`;
    
    this.templateOptions.metadata = {
      Template: this.stackName,
      Description: props.longDescription,
      Project: props.project,
      Application: props.application,
      Version: props.version,
      Stack: props.stackName,
    };
  }

}