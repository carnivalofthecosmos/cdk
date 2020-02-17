import { Construct } from '@aws-cdk/core';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';

export class CoreDns extends Construct {
  readonly rootZone: IHostedZone;
  readonly mainZone: IHostedZone;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // this.mainZone = new HostedZone(this, "MainZone", {
    //   zoneName: `${env}.${project}.${tld}`,
    //   comment: "Main Zone for the Environment."
    // });
  }
}
