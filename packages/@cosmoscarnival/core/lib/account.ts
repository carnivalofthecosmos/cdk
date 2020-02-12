import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { ProjectApp } from '.';

export interface AccountStackProps extends StackProps {}

export class AccountStack extends Stack {
  readonly projectApp: ProjectApp;
  readonly account: string;

  constructor(projectApp: ProjectApp, account: string, props?: AccountStackProps) {
    super(projectApp, `Core-${account}-Account`, props);

    this.projectApp = projectApp;
    this.account = account;
  }
}
