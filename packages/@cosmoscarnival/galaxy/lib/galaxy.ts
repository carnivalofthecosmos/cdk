import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { CosmosStack } from "./cosmos";

export interface GalaxyStackProps extends StackProps {}

export class GalaxyStack extends Stack {
  readonly cosmos: CosmosStack;

  constructor(cosmos: CosmosStack, id: string, props?: GalaxyStackProps) {
    super(cosmos.app, `Cosmos-Galaxy-${id}`, props);

    this.cosmos = cosmos;
  }
}
