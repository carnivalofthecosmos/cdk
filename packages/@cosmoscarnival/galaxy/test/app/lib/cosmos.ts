import { App, Stack, StackProps } from "@aws-cdk/core";
import { HostedZone, IHostedZone } from "@aws-cdk/aws-route53";

export interface CosmosStackProps extends StackProps {}

export class CosmosStack extends Stack {
  readonly app: App;
  readonly zone: HostedZone;
  constructor(app: App, id?: string, props?: CosmosStackProps) {
    super(app, id ? `Cosmos-${id}` : "Cosmos", props);

    this.app = app;

    this.zone = new HostedZone(this, "HostedZone", {
      zoneName: `cosmos.iag.com`
    });
  }
}
