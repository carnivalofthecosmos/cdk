// import { Construct, Duration } from '@aws-cdk/core';

// export interface LibTemplateProps {
//   /**
//    * The visibility timeout to be configured on the SQS Queue, in seconds.
//    *
//    * @default Duration.seconds(300)
//    */
//   visibilityTimeout?: Duration;
// }

// export class LibTemplate extends Construct {
//   /** @returns the ARN of the SQS queue */
//   public readonly queueArn: string;

//   constructor(scope: Construct, id: string, props: LibTemplateProps = {}) {
//     super(scope, id);
//   }
// }

export const CORE_TLD = 'CORE_TLD';

export { ProjectApp, ProjectAppProps } from './project';
export { AccountStack, AccountStackProps } from './account';
export { IAppEnv, AppEnvStack, AppEnvStackProps, EcsAppEnvStack, EcsAppEnvStackProps } from './appEnv';
export { EcsServiceStack, EcsServiceStackProps } from './ecs-service';
