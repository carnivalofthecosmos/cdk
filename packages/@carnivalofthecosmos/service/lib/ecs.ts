import { Construct } from '@aws-cdk/core';
import {
  Ec2TaskDefinition,
  Ec2Service,
  Protocol,
  ContainerDefinitionOptions,
  PortMapping,
  Ec2ServiceProps,
} from '@aws-cdk/aws-ecs';
import {
  ApplicationTargetGroup,
  ApplicationProtocol,
  ApplicationListenerRule,
  ApplicationListenerRuleProps,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { IEcsAppEnv } from '@carnivalofthecosmos/core';

export interface EcsServiceProps {
  coreAppEnv: IEcsAppEnv;
  container: ContainerDefinitionOptions & { port?: PortMapping };
  service: Partial<Ec2ServiceProps>;
  routing: {
    pathPattern: string;
    priority: number;
  };
}

export class EcsService extends Construct {
  readonly TaskDefinition: Ec2TaskDefinition;
  readonly Service: Ec2Service;
  readonly ApplicationTargetGroup: ApplicationTargetGroup;

  constructor(scope: Construct, id: string, props: EcsServiceProps) {
    super(scope, id);

    const { coreAppEnv, container, service, routing } = props;

    this.TaskDefinition = new Ec2TaskDefinition(this, 'Task', {
      family: `${id}-Task`,
    });

    this.TaskDefinition.addContainer('AppContainer', {
      memoryLimitMiB: 256,
      ...container,
    }).addPortMappings({
      containerPort: 80,
      protocol: Protocol.TCP,
      ...container.port,
    });

    this.Service = new Ec2Service(this, 'Service', {
      desiredCount: 1,
      ...service,
      taskDefinition: this.TaskDefinition,
      cluster: coreAppEnv.Cluster,
      serviceName: `${id}-Service`,
    });

    const targetGroup = new ApplicationTargetGroup(this, 'ServiceTargetGroup', {
      vpc: coreAppEnv.Vpc,
      targetGroupName: `${id}-TargetGroup`,
      protocol: ApplicationProtocol.HTTP,
      targets: [
        this.Service.loadBalancerTarget({
          containerName: 'AppContainer',
        }),
      ],
    });

    new ApplicationListenerRule(this, 'ServiceRule', {
      ...routing,
      listener: coreAppEnv.HttpListener,
      targetGroups: [targetGroup],
    });
  }
}
