import { Construct, Stack, StackProps } from '@aws-cdk/core';
import {
  IVpc,
  SubnetType,
  Vpc,
  GatewayVpcEndpointAwsService,
  InterfaceVpcEndpointAwsService,
  InstanceType,
} from '@aws-cdk/aws-ec2';
import { IHostedZone, HostedZone, ZoneDelegationRecord } from '@aws-cdk/aws-route53';
import { Cluster, Ec2TaskDefinition, Ec2Service, ContainerImage, Protocol } from '@aws-cdk/aws-ecs';
import { ApplicationLoadBalancer, ApplicationListener, ApplicationTargetGroup } from '@aws-cdk/aws-elasticloadbalancingv2';
import { Repository } from '@aws-cdk/aws-ecr';
import { LambdaTarget } from '@aws-cdk/aws-elasticloadbalancingv2-targets';
import { AccountStack } from '.';

export interface IAppEnv extends Construct {
  accountStack: AccountStack;
  vpc: IVpc;
}

export interface AppEnvStackProps extends StackProps {}

export class AppEnvStack extends Stack implements IAppEnv {
  readonly accountStack: AccountStack;
  readonly appEnv: string;
  readonly vpc: IVpc;
  readonly zone: IHostedZone;

  constructor(accountStack: AccountStack, appEnv: string, props?: AppEnvStackProps) {
    super(accountStack.projectApp, `Core-${accountStack.account}-${appEnv}-AppEnv`, {
      ...props,
      //   env: {  TODO:
      //     account: accountStack.account,
      //     region: accountStack.region,
      //   },
    });

    this.accountStack = accountStack;
    this.appEnv = appEnv;

    this.vpc = this.accountStack.node.tryFindChild('SharedVpc') as IVpc;
    if (!this.vpc) {
      this.vpc = new Vpc(this.accountStack, 'SharedVpc', {
        cidr: '10.0.0.0/22',
        maxAzs: 3,
        subnetConfiguration: [
          {
            name: 'Core',
            subnetType: SubnetType.ISOLATED,
            cidrMask: 26,
          },
        ],
      });

      // TODO: move to internet endpoint Endpoints ?
      this.vpc.addGatewayEndpoint('S3Gateway', {
        service: GatewayVpcEndpointAwsService.S3,
        subnets: [this.vpc.selectSubnets({ onePerAz: true })],
      });
      this.vpc.addInterfaceEndpoint('EcsEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECS,
      });
      this.vpc.addInterfaceEndpoint('EcsAgentEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECS_AGENT,
      });
      this.vpc.addInterfaceEndpoint('EcsTelemetryEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECS_TELEMETRY,
      });
      this.vpc.addInterfaceEndpoint('EcrEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECR,
      });
      this.vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      });
    }

    const cosmosZoneName = this.accountStack.projectApp.zone.zoneName;
    this.zone = new HostedZone(this, 'HostedZone', {
      zoneName: `${appEnv}.${cosmosZoneName}`.toLowerCase(),
    });

    new ZoneDelegationRecord(this, 'ZoneDelegation', {
      zone: this.accountStack.projectApp.zone,
      recordName: this.zone.zoneName,
      nameServers: this.zone.hostedZoneNameServers as string[],
    });
  }
}

// ECS Target AppEnv
export interface EcsAppEnvStackProps extends AppEnvStackProps {}

export class EcsAppEnvStack extends AppEnvStack {
  readonly cluster: Cluster;
  readonly alb: ApplicationLoadBalancer;
  readonly httpListener: ApplicationListener;
  readonly httpsListener: ApplicationListener;
  readonly targetGroup: ApplicationTargetGroup;

  constructor(scope: AccountStack, appEnv: string, props?: EcsAppEnvStackProps) {
    super(scope, appEnv, props);

    this.cluster = new Cluster(this, 'Cluster', {
      vpc: this.vpc,
    });

    this.cluster.addCapacity('Capacity', {
      instanceType: new InstanceType('t2.medium'),
      desiredCapacity: 1,
    });

    this.alb = new ApplicationLoadBalancer(this, 'Alb', {
      vpc: this.vpc,
    });
    this.targetGroup = new ApplicationTargetGroup(this, 'AppTargetGroup', {
      vpc: this.vpc,
      port: 80,
    })
    this.httpListener = this.alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [this.targetGroup]
    });

    // TODO:

    // this.httpListener = this.alb.addListener("HttpsListener", {
    //   port: 443,
    //   open: true
    // });

    // TODO: Remove, for testing
    const taskDefinition = new Ec2TaskDefinition(this, 'HealthCheckTask');
    taskDefinition
      .addContainer('HealthCheckContainer', {
        image: ContainerImage.fromAsset(`${__dirname}/../assets/healthcheck`),
        memoryLimitMiB: 512,
      })
      .addPortMappings({
        containerPort: 80,
        protocol: Protocol.TCP,
      });

    const ecsService = new Ec2Service(this, 'HealthCheckService', {
      cluster: this.cluster,
      taskDefinition,
    });

    this.httpListener.addTargets('HealthCheck', {
      port: 80,
      targets: [
        ecsService.loadBalancerTarget({
          containerName: 'HealthCheckContainer',
        }),
      ],
    });
  }
}
