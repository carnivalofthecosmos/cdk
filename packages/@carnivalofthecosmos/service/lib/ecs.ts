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
import { IConsumerEcsAppEnv } from '@carnivalofthecosmos/core';

export interface EcsServiceProps {
  container: ContainerDefinitionOptions & { port?: PortMapping };
  service: Partial<Ec2ServiceProps>;
  routing: {
    pathPattern: string;
    priority: number;
  };
}

// TODO: Split into Generic version and Consumer Version
export class EcsService extends Construct {
  readonly TaskDefinition: Ec2TaskDefinition;
  readonly Service: Ec2Service;
  readonly ApplicationTargetGroup: ApplicationTargetGroup;

  constructor(appEnv: IConsumerEcsAppEnv, id: string, props: EcsServiceProps) {
    super(appEnv, id);

    const { container, service, routing } = props;
    const projectName = appEnv.Account.Project.Name;
    const envName = appEnv.Name;

    this.TaskDefinition = new Ec2TaskDefinition(this, 'Task', {
      family: `App-${projectName}-${envName}-${id}-Task`,
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
      serviceName: `App-${projectName}-${envName}-${id}-Service`,
      taskDefinition: this.TaskDefinition,
      cluster: appEnv.Core.Cluster,
    });

    const targetGroupName = `${projectName}-${envName}-${id}-TG`;
    const targetGroup = new ApplicationTargetGroup(this, 'ServiceTargetGroup', {
      vpc: appEnv.Core.Vpc,
      targetGroupName: targetGroupName.length <= 32 ? targetGroupName : undefined, // TODO: Add warning for this case
      protocol: ApplicationProtocol.HTTP,
      targets: [
        this.Service.loadBalancerTarget({
          containerName: 'AppContainer',
        }),
      ],
    });

    new ApplicationListenerRule(this, 'ServiceRule', {
      ...routing,
      listener: appEnv.Core.HttpListener,
      targetGroups: [targetGroup],
    });
  }
}
