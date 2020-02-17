import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { Ec2TaskDefinition, Ec2Service, ContainerImage, Protocol } from '@aws-cdk/aws-ecs';
import {
  ApplicationTargetGroup,
  ApplicationProtocol,
  ApplicationListenerRule,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { Repository } from '@aws-cdk/aws-ecr';
import { EcsAppEnvStack } from '../../lib/appEnv';

export interface EcsServiceStackProps extends StackProps {
  ecsAppEnv: EcsAppEnvStack;
}

export class EcsServiceStack extends Stack {
  constructor(scope: Construct, ecsSvc: string, props: EcsServiceStackProps) {
    super(scope, ecsSvc, props);

    const { ecsAppEnv } = props;

    const ecr = Repository.fromRepositoryName(this, 'ecr', 'cdk/test');

    const taskDefinition = new Ec2TaskDefinition(this, 'TaskDef');
    taskDefinition
      .addContainer('DefaultContainer', {
        image: ContainerImage.fromEcrRepository(ecr, 'latest'),
        memoryLimitMiB: 512,
      })
      .addPortMappings({
        containerPort: 3000,
        protocol: Protocol.TCP,
      });

    const ecsService = new Ec2Service(this, 'Service', {
      cluster: ecsAppEnv.Cluster,
      taskDefinition,
      desiredCount: 1,
    });
    const targetGroup = new ApplicationTargetGroup(this, 'ServiceTargetGroup', {
      vpc: ecsAppEnv.vpc,
      protocol: ApplicationProtocol.HTTP,
      targets: [
        ecsService.loadBalancerTarget({
          containerName: 'DefaultContainer',
        }),
      ],
    });
    new ApplicationListenerRule(this, 'ServiceRule', {
      listener: ecsAppEnv.HttpListener,
      targetGroups: [targetGroup],
      pathPattern: '/svc',
      priority: 1,
    });

    const ecsService2 = new Ec2Service(this, 'Service2', {
      cluster: ecsAppEnv.Cluster,
      taskDefinition,
      desiredCount: 2,
    });
    const targetGroup2 = new ApplicationTargetGroup(this, 'ServiceTargetGroup2', {
      vpc: ecsAppEnv.vpc,
      protocol: ApplicationProtocol.HTTP,
      targets: [
        ecsService2.loadBalancerTarget({
          containerName: 'DefaultContainer',
        }),
      ],
    });
    new ApplicationListenerRule(this, 'ServiceRule2', {
      listener: ecsAppEnv.HttpListener,
      targetGroups: [targetGroup2],
      pathPattern: '/svc2',
      priority: 2,
    });
  }
}
