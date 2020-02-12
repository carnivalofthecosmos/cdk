import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { IVpc } from '@aws-cdk/aws-ec2';
import { Cluster, ICluster, Ec2TaskDefinition, Ec2Service, ContainerImage, Protocol } from '@aws-cdk/aws-ecs';
import {
  ApplicationLoadBalancer,
  ApplicationListener,
  ApplicationTargetGroup,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { Repository } from "@aws-cdk/aws-ecr";
import { EcsAppEnvStack } from './appEnv';

export interface EcsServiceStackProps extends StackProps {
    ecsEnv: EcsAppEnvStack;
}

export class EcsServiceStack extends Stack {
     
    constructor(scope: Construct, ecsSvc: string, props: EcsServiceStackProps) {
    super(scope, ecsSvc, props);
    const envCluster = props.ecsEnv.cluster;
    const targetGroup = props.ecsEnv.targetGroup;


    const ecr = Repository.fromRepositoryName(this, "ecr", "cdk/test");

    const taskDefinition = new Ec2TaskDefinition(this, "TaskDef");
    taskDefinition
      .addContainer("DefaultContainer", {
        image: ContainerImage.fromEcrRepository(ecr, "latest"),
        memoryLimitMiB: 512
      })
      .addPortMappings({
        containerPort: 3000,
        protocol: Protocol.TCP
      });

    const ecsService = new Ec2Service(this, "Service", {
      cluster: envCluster,
      taskDefinition
    });
    targetGroup.addTarget(ecsService)

    const ecs2Service = new Ec2Service(this, "Service2", {
      cluster: envCluster,
      taskDefinition
    });
    targetGroup.addTarget(ecs2Service)
  }
}
