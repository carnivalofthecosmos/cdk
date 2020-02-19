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
import { Cluster, ICluster } from '@aws-cdk/aws-ecs';
import {
  ApplicationLoadBalancer,
  ApplicationListener,
  ApplicationTargetGroup,
  ApplicationProtocol,
  TargetType,
  IApplicationLoadBalancer,
  IApplicationListener,
} from '@aws-cdk/aws-elasticloadbalancingv2';
import { NetworkBuilder } from '@aws-cdk/aws-ec2/lib/network-util';
import { IAccount, RemoteVpc, RemoteZone, RemoteCluster, RemoteAlb, RemoteApplicationListener } from '.';

export interface IAppEnv extends Construct {
  Account: IAccount;
  AppEnv: string;
  Vpc: IVpc;
  Zone: IHostedZone;
}

export interface AppEnvStackProps extends StackProps {
  networkBuilder?: NetworkBuilder;
}

export class AppEnvStack extends Stack implements IAppEnv {
  readonly Account: IAccount;
  readonly AppEnv: string;
  readonly Vpc: Vpc;
  readonly Zone: HostedZone;

  constructor(account: IAccount, appEnv: string, props?: AppEnvStackProps) {
    super(account.Project.Scope, `Core-${account.Account}-${appEnv}-AppEnv`, {
      ...props,
      //   env: {  TODO:
      //     account: accountStack.account,
      //     region: accountStack.region,
      //   },
    });

    const { networkBuilder } = props || {};

    this.Account = account;
    this.AppEnv = appEnv;

    this.Vpc = this.Account.node.tryFindChild('SharedVpc') as Vpc;
    if (!this.Vpc) {
      if (!networkBuilder) throw new Error('NetworkBuilder is required for first app env defined.');

      this.Vpc = new Vpc(this.Account, 'SharedVpc', {
        cidr: networkBuilder.addSubnet(24),
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
      this.Vpc.addGatewayEndpoint('S3Gateway', {
        service: GatewayVpcEndpointAwsService.S3,
        subnets: [this.Vpc.selectSubnets({ onePerAz: true })],
      });
      this.Vpc.addInterfaceEndpoint('EcsEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECS,
      });
      this.Vpc.addInterfaceEndpoint('EcsAgentEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECS_AGENT,
      });
      this.Vpc.addInterfaceEndpoint('EcsTelemetryEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECS_TELEMETRY,
      });
      this.Vpc.addInterfaceEndpoint('EcrEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECR,
      });
      this.Vpc.addInterfaceEndpoint('EcrDockerEndpoint', {
        service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      });

      RemoteVpc.export(this.Account.Account, this.Vpc);
    }

    const rootZoneName = this.Account.Project.Zone.zoneName;
    this.Zone = new HostedZone(this, 'Zone', {
      zoneName: `${appEnv}.${rootZoneName}`.toLowerCase(),
    });
    new ZoneDelegationRecord(this, 'ZoneDelegation', {
      zone: this.Account.Project.Zone,
      recordName: this.Zone.zoneName,
      nameServers: this.Zone.hostedZoneNameServers as string[],
    });

    RemoteZone.export(`${this.Account.Account}${this.AppEnv}`, this.Zone);
  }
}

// ECS Target AppEnv
export interface IEcsAppEnv extends IAppEnv {
  Cluster: ICluster;
  Alb: IApplicationLoadBalancer;
  HttpListener: IApplicationListener;
  // HttpsListener: IApplicationListener;
}

export interface EcsAppEnvStackProps extends AppEnvStackProps {}

export class EcsAppEnvStack extends AppEnvStack implements IEcsAppEnv {
  readonly Cluster: Cluster;
  readonly Alb: ApplicationLoadBalancer;
  readonly HttpListener: ApplicationListener;
  // readonly HttpsListener: ApplicationListener;

  constructor(account: IAccount, appEnv: string, props?: EcsAppEnvStackProps) {
    super(account, appEnv, props);

    this.Cluster = new Cluster(this, 'Cluster', {
      vpc: this.Vpc,
      clusterName: `Core-${this.Account.Account}-${this.AppEnv}-Cluster`,
    });

    this.Cluster.addCapacity('Capacity', {
      instanceType: new InstanceType('t2.medium'),
      desiredCapacity: 1,
      minCapacity: 1,
      maxCapacity: 5,
    });

    this.Alb = new ApplicationLoadBalancer(this, 'Alb', {
      vpc: this.Vpc,
    });
    this.HttpListener = this.Alb.addListener('HttpListener', {
      protocol: ApplicationProtocol.HTTP,
      defaultTargetGroups: [
        new ApplicationTargetGroup(this, 'DefaultTargetGroup', {
          vpc: this.Vpc,
          protocol: ApplicationProtocol.HTTP,
          targetType: TargetType.INSTANCE,
        }),
      ],
    });

    // TODO:

    // this.httpListener = this.alb.addListener("HttpsListener", {
    //   port: 443,
    //   open: true
    // });

    RemoteCluster.export(`${this.Account.Account}${this.AppEnv}`, this.Cluster);
    RemoteAlb.export(`${this.Account.Account}${this.AppEnv}`, this.Alb);
    RemoteApplicationListener.export(`${this.Account.Account}${this.AppEnv}`, this.HttpListener);
  }
}

// Import

export class ImportedAppEnv extends Construct implements IAppEnv {
  readonly Account: IAccount;
  readonly AppEnv: string;
  readonly Vpc: IVpc;
  readonly Zone: IHostedZone;

  constructor(scope: Construct, account: IAccount, appEnv: string) {
    super(scope, `Core-${account.Account}-${appEnv}-AppEnv`);

    this.Account = account;
    this.AppEnv = appEnv;
    this.Vpc = RemoteVpc.import(this, this.Account.Account, 'SharedVpc', { hasIsolated: true });
    this.Zone = RemoteZone.import(this, `${this.Account.Account}${this.AppEnv}`, 'Zone');
  }
}

export class ImportedEcsAppEnv extends ImportedAppEnv implements IEcsAppEnv {
  readonly Cluster: ICluster;
  readonly Alb: IApplicationLoadBalancer;
  readonly HttpListener: IApplicationListener;
  // readonly HttpsListener: IApplicationListener;

  constructor(scope: Construct, account: IAccount, appEnv: string) {
    super(scope, account, appEnv);

    this.Cluster = RemoteCluster.import(this, `${this.Account.Account}${this.AppEnv}`, 'Cluster', this.Vpc);
    this.Alb = RemoteAlb.import(this, `${this.Account.Account}${this.AppEnv}`, 'Alb');
    this.HttpListener = RemoteApplicationListener.import(this, `${this.Account.Account}${this.AppEnv}`, 'HttpListener');
  }
}
