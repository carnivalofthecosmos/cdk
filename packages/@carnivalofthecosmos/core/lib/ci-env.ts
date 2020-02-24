import { Stack, StackProps, Construct } from '@aws-cdk/core';
import { Vpc, SubnetType, InstanceType, IVpc } from '@aws-cdk/aws-ec2';
import { NetworkBuilder } from '@aws-cdk/aws-ec2/lib/network-util';
import { HostedZone, ZoneDelegationRecord, IHostedZone } from '@aws-cdk/aws-route53';
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
import { IAccount, IEcsAppEnv, RemoteVpc, RemoteZone, RemoteCluster, RemoteAlb, RemoteApplicationListener } from '.';

export interface CiEnvStackProps extends StackProps {
  networkBuilder: NetworkBuilder;
}

export class CiEnvStack extends Stack implements IEcsAppEnv {
  readonly Account: IAccount;
  readonly Name: string;
  readonly Vpc: Vpc;
  readonly Zone: HostedZone;
  readonly Cluster: Cluster;
  readonly Alb: ApplicationLoadBalancer;
  readonly HttpListener: ApplicationListener;

  constructor(account: IAccount, props: CiEnvStackProps) {
    super(account.Project.Scope, `Core-${account.Name}-Ci-Env`);

    const { networkBuilder } = props;

    this.Account = account;
    this.Name = 'Ci';

    this.Vpc = new Vpc(this, 'Vpc', {
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

    const rootZoneName = this.Account.Project.Zone.zoneName;
    this.Zone = new HostedZone(this, 'Zone', {
      zoneName: `ci.${rootZoneName}`.toLowerCase(),
    });
    new ZoneDelegationRecord(this, 'ZoneDelegation', {
      zone: this.Account.Project.Zone,
      recordName: this.Zone.zoneName,
      nameServers: this.Zone.hostedZoneNameServers as string[],
    });

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

    RemoteVpc.export(`Core${this.Account.Name}${this.Name}`, this.Vpc);
    RemoteZone.export(`Core${this.Account.Name}${this.Name}`, this.Zone);
    RemoteCluster.export(`Core${this.Account.Name}${this.Name}`, this.Cluster);
    RemoteAlb.export(`Core${this.Account.Name}${this.Name}`, this.Alb);
    RemoteApplicationListener.export(`Core${this.Account.Name}${this.Name}`, this.HttpListener);
  }
}

export class ImportedCiEnv extends Construct implements IEcsAppEnv {
  readonly Account: IAccount;
  readonly Name: string;
  readonly Vpc: IVpc;
  readonly Zone: IHostedZone;
  readonly Cluster: ICluster;
  readonly Alb: IApplicationLoadBalancer;
  readonly HttpListener: IApplicationListener;

  constructor(scope: Construct, account: IAccount) {
    super(scope, `Core-${account.Name}-Ci-Env`);

    this.Account = account;
    this.Name = 'Ci';

    this.Vpc = RemoteVpc.import(this, `Core${this.Account.Name}${this.Name}`, 'Vpc', { hasIsolated: true });
    this.Zone = RemoteZone.import(this, `Core${this.Account.Name}${this.Name}`, 'Zone');
    this.Cluster = RemoteCluster.import(this, `Core${this.Account.Name}${this.Name}`, 'Cluster', this.Vpc);
    this.Alb = RemoteAlb.import(this, `Core${this.Account.Name}${this.Name}`, 'Alb');
    this.HttpListener = RemoteApplicationListener.import(this, `Core${this.Account.Name}${this.Name}`, 'HttpListener');
  }
}
