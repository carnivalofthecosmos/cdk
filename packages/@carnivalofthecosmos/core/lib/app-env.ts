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
import {
  ICoreAccount,
  ICoreAppEnv,
  ICoreEcsAppEnv,
  RemoteVpc,
  RemoteZone,
  RemoteCluster,
  RemoteAlb,
  RemoteApplicationListener,
} from '.';

export interface AppEnvStackProps extends StackProps {
  networkBuilder?: NetworkBuilder;
}

export class AppEnvStack extends Stack implements ICoreAppEnv {
  readonly Account: ICoreAccount;
  readonly Name: string;
  readonly Vpc: Vpc;
  readonly Zone: HostedZone;

  constructor(account: ICoreAccount, name: string, props?: AppEnvStackProps) {
    super(account.Project.Scope, `Core-${account.Name}-${name}-AppEnv`, {
      ...props,
      //   env: {  TODO:
      //     account: accountStack.account,
      //     region: accountStack.region,
      //   },
    });

    const { networkBuilder } = props || {};

    this.Account = account;
    this.Name = name;

    this.Vpc = this.Account.node.tryFindChild('SharedVpc') as Vpc;
    if (!this.Vpc) {
      if (!networkBuilder) {
        throw new Error(`NetworkBuilder is required for first app env defined (Env: ${this.Name}?).`);
      }

      this.Vpc = new Vpc(this.Account, 'SharedVpc', {
        cidr: networkBuilder.addSubnet(24),
        maxAzs: 3,
        subnetConfiguration: [
          {
            name: 'Main',
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

      RemoteVpc.export(`Core${this.Account.Name}`, this.Vpc);
    }

    const rootZoneName = this.Account.Project.Zone.zoneName;
    this.Zone = new HostedZone(this, 'Zone', {
      zoneName: `${name}.${rootZoneName}`.toLowerCase(),
    });
    new ZoneDelegationRecord(this, 'ZoneDelegation', {
      zone: this.Account.Project.Zone,
      recordName: this.Zone.zoneName,
      nameServers: this.Zone.hostedZoneNameServers as string[],
    });

    RemoteZone.export(`Core${this.Account.Name}${this.Name}`, this.Zone);
  }
}

// ECS Target AppEnv
export interface EcsAppEnvStackProps extends AppEnvStackProps {}

export class EcsAppEnvStack extends AppEnvStack implements ICoreEcsAppEnv {
  readonly Cluster: Cluster;
  readonly Alb: ApplicationLoadBalancer;
  readonly HttpListener: ApplicationListener;
  // readonly HttpsListener: ApplicationListener;

  constructor(account: ICoreAccount, name: string, props?: EcsAppEnvStackProps) {
    super(account, name, props);

    this.Cluster = new Cluster(this, 'Cluster', {
      vpc: this.Vpc,
      clusterName: `Core-${this.Account.Name}-${this.Name}-Cluster`,
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

    RemoteCluster.export(`Core${this.Account.Name}${this.Name}`, this.Cluster);
    RemoteAlb.export(`Core${this.Account.Name}${this.Name}`, this.Alb);
    RemoteApplicationListener.export(`Core${this.Account.Name}${this.Name}`, this.HttpListener);
  }
}

// Import

export class ImportedAppEnv extends Construct implements ICoreAppEnv {
  readonly Account: ICoreAccount;
  readonly Name: string;
  readonly Vpc: IVpc;
  readonly Zone: IHostedZone;

  constructor(scope: Construct, account: ICoreAccount, name: string) {
    super(scope, `Core-${account.Name}-${name}-AppEnv`);

    this.Account = account;
    this.Name = name;
    this.Vpc = RemoteVpc.import(this, `Core${this.Account.Name}`, 'SharedVpc', { hasIsolated: true });
    this.Zone = RemoteZone.import(this, `Core${this.Account.Name}${this.Name}`, 'Zone');
  }
}

export class ImportedEcsAppEnv extends ImportedAppEnv implements ICoreEcsAppEnv {
  readonly Cluster: ICluster;
  readonly Alb: IApplicationLoadBalancer;
  readonly HttpListener: IApplicationListener;
  // readonly HttpsListener: IApplicationListener;

  constructor(scope: Construct, account: ICoreAccount, name: string) {
    super(scope, account, name);

    this.Cluster = RemoteCluster.import(this, `Core${this.Account.Name}${this.Name}`, 'Cluster', this.Vpc);
    this.Alb = RemoteAlb.import(this, `Core${this.Account.Name}${this.Name}`, 'Alb');
    this.HttpListener = RemoteApplicationListener.import(this, `Core${this.Account.Name}${this.Name}`, 'HttpListener');
  }
}
