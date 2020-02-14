import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { IProject, IAccount, IEcsAppEnv, ImportedProject, ImportedAccount, ImportedEcsAppEnv } from '.';
import {} from './project';

export interface ConsumerStackProps extends StackProps {}

export class ConsumerStack extends Stack {
  readonly Project: IProject;
  readonly Account: IAccount;
  readonly Env: IEcsAppEnv;
  readonly Id: string;

  constructor(
    scope: Construct,
    project: string,
    account: string,
    appEnv: string,
    id: string,
    props?: ConsumerStackProps,
  ) {
    super(scope, `App-${account}-${appEnv}-${id}`, props);

    this.Project = new ImportedProject(this, project);
    this.Account = new ImportedAccount(this, this.Project, account);
    this.Env = new ImportedEcsAppEnv(this, this.Account, appEnv);
    this.Id = id;
  }
}
