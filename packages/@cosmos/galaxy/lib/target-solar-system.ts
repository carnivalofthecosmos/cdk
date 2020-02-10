import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { Vpc, SubnetType, IVpc } from "@aws-cdk/aws-ec2";
import {
  HostedZone,
  ZoneDelegationRecord,
  IHostedZone
} from "@aws-cdk/aws-route53";
import { GalaxyStack, ISolarSystem } from ".";

export interface TargetSolarSystemStackProps extends StackProps {
  appEnv: string;
}

export class TargetSolarSystemStack extends Stack implements ISolarSystem {
  readonly galaxy: GalaxyStack;
  readonly vpc: IVpc;
  readonly zone: IHostedZone;

  constructor(
    galaxy: GalaxyStack,
    id: string,
    props: TargetSolarSystemStackProps
  ) {
    super(galaxy.cosmos.app, `Cosmos-TargetSolarSystem-${id}`, props);

    this.galaxy = galaxy;

    const { appEnv } = props;

    this.vpc = this.galaxy.node.tryFindChild("TargetSolarSystemVpc") as IVpc;
    if (!this.vpc) {
      this.vpc = new Vpc(this.galaxy, "TargetSolarSystemVpc", {
        cidr: "10.0.0.0/22",
        maxAzs: 3,
        subnetConfiguration: [
          {
            name: "Core",
            subnetType: SubnetType.ISOLATED,
            cidrMask: 26
          }
        ]
      });
    }

    const cosmosZoneName = this.galaxy.cosmos.zone.zoneName;
    this.zone = new HostedZone(this, "TargetSolarSystemZone", {
      zoneName: `${appEnv}.${cosmosZoneName}`
    });

    new ZoneDelegationRecord(this, "TargetSolarSystemZoneDelegation", {
      zone: this.galaxy.cosmos.zone,
      recordName: this.zone.zoneName,
      nameServers: this.zone.hostedZoneNameServers as string[]
    });
  }
}
