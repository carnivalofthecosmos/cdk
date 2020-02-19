import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { NetworkBuilder } from '@aws-cdk/aws-ec2/lib/network-util';
import { IProject } from '.';

export interface IAccount extends Construct {
  Project: IProject;
  Account: string;
}

export interface AccountStackProps extends StackProps {
  cidr: string;
}

export class AccountStack extends Stack implements IAccount {
  readonly Project: IProject;
  readonly Account: string;
  readonly NetworkBuilder: NetworkBuilder;

  constructor(project: IProject, account: string, props: AccountStackProps) {
    super(project.Scope, `Core-${account}-Account`, props);

    const { cidr } = props;

    this.Project = project;
    this.Account = account;
    this.NetworkBuilder = new NetworkBuilder(cidr);
  }
}

export class ImportedAccount extends Construct implements IAccount {
  readonly Project: IProject;
  readonly Account: string;
  constructor(scope: Construct, project: IProject, account: string) {
    super(scope, `Core-${account}-Account`);

    this.Project = project;
    this.Account = account;
  }
}
