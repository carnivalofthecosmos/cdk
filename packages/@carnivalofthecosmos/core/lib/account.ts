import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { NetworkBuilder } from '@aws-cdk/aws-ec2/lib/network-util';
import { IProject } from '.';

export interface IAccount extends Construct {
  Project: IProject;
  Name: string;
}

export interface AccountStackProps extends StackProps {
  cidr: string;
}

export class AccountStack extends Stack implements IAccount {
  readonly Project: IProject;
  readonly Name: string;
  readonly NetworkBuilder: NetworkBuilder;

  constructor(project: IProject, name: string, props: AccountStackProps) {
    super(project.Scope, `Core-${name}-Account`, props);

    const { cidr } = props;

    this.Project = project;
    this.Name = name;
    this.NetworkBuilder = new NetworkBuilder(cidr);
  }
}

export class ImportedAccount extends Construct implements IAccount {
  readonly Project: IProject;
  readonly Name: string;
  constructor(scope: Construct, project: IProject, name: string) {
    super(scope, `Core-${name}-Account`);

    this.Project = project;
    this.Name = name;
  }
}
