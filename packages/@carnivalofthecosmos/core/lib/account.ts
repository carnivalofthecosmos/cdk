import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { IProject, ProjectStack } from '.';

export interface IAccount extends Construct {
  Project: IProject;
  Account: string;
}

export interface AccountStackProps extends StackProps {}

export class AccountStack extends Stack implements IAccount {
  readonly Project: IProject;
  readonly Account: string;

  constructor(project: IProject, account: string, props?: AccountStackProps) {
    super(project.App, `Core-${account}-Account`, props);

    this.Project = project;
    this.Account = account;
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
