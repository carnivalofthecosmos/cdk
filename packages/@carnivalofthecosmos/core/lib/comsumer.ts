import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { IProject, IAccount, IEcsAppEnv, ImportedProject, ImportedAccount, ImportedAppEnv, ImportedEcsAppEnv } from '.';
import {} from './project';
import { IAppEnv } from './appEnv';

export class ConsumerProjectStack extends Stack {
  readonly Scope: Construct;
  readonly Project: string;
  readonly CoreProject: IProject;

  constructor(scope: Construct, project: string, props?: StackProps) {
    super(scope, `App-${project}-Project`, props);

    this.Scope = scope;
    this.Project = project;
    this.CoreProject = new ImportedProject(this);
  }
}

export class ConsumerAccountStack extends Stack {
  readonly Project: ConsumerProjectStack;
  readonly Account: string;
  readonly CoreAccount: IAccount;

  constructor(project: ConsumerProjectStack, account: string, props?: StackProps) {
    super(project.Scope, `App-${project.Project}-${account}-Account`, props);

    this.Project = project;
    this.Account = account;
    this.CoreAccount = new ImportedAccount(this, this.Project.CoreProject, account);
  }
}

export class ConsumerAppEnvStack extends Stack {
  readonly Account: ConsumerAccountStack;
  readonly AppEnv: string;
  readonly CoreAppEnv: IAppEnv;
  readonly Id: string;

  constructor(account: ConsumerAccountStack, appEnv: string, props?: StackProps) {
    super(account.Project.Scope, `App-${account.Project.Project}-${account.Account}-${appEnv}-AppEnv`, props);

    this.Account = account;
    this.AppEnv = appEnv;
    this.CoreAppEnv = new ImportedAppEnv(this, this.Account.CoreAccount, appEnv);
  }
}

export class ConsumerEcsAppEnvStack extends ConsumerAppEnvStack {
  readonly CoreAppEnv: IEcsAppEnv;
  constructor(account: ConsumerAccountStack, appEnv: string, props?: StackProps) {
    super(account, appEnv, props);

    this.node.tryRemoveChild(this.CoreAppEnv.node.id);

    this.CoreAppEnv = new ImportedEcsAppEnv(this, this.Account.CoreAccount, appEnv);
  }
}
