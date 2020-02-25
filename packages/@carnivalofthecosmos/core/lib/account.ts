import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { NetworkBuilder } from '@aws-cdk/aws-ec2/lib/network-util';
import { ICoreProject, ICoreAccount } from '.';

export interface AccountStackProps extends StackProps {
  cidr: string;
}

export class AccountStack extends Stack implements ICoreAccount {
  readonly Project: ICoreProject;
  readonly Name: string;
  readonly NetworkBuilder: NetworkBuilder;

  constructor(project: ICoreProject, name: string, props: AccountStackProps) {
    super(project.Scope, `Core-${name}-Account`, props);

    const { cidr } = props;

    this.Project = project;
    this.Name = name;
    this.NetworkBuilder = new NetworkBuilder(cidr);
  }
}

export class ImportedAccount extends Construct implements ICoreAccount {
  readonly Project: ICoreProject;
  readonly Name: string;
  constructor(scope: Construct, project: ICoreProject, name: string) {
    super(scope, `Core-${name}-Account`);

    this.Project = project;
    this.Name = name;
  }
}
