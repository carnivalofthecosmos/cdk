import { Construct, Stack, StackProps } from '@aws-cdk/core';
import {
  IProject,
  IAccount,
  IAppEnv,
  IEcsAppEnv,
  ImportedProject,
  ImportedAccount,
  ImportedAppEnv,
  ImportedEcsAppEnv,
  ImportedCiEnv,
} from '.';

export interface IConsumerProject extends Construct {
  Scope: Construct;
  Project: string;
  CoreProject: IProject;
}

export interface IConsumerAccount extends Construct {
  Project: IConsumerProject;
  Account: string;
  CoreAccount: IAccount;
}

export interface IConsumerAppEnv extends Construct {
  Account: IConsumerAccount;
  AppEnv: string;
  CoreAppEnv: IAppEnv;
}

export interface IConsumerEcsAppEnv extends Construct {
  Account: IConsumerAccount;
  AppEnv: string;
  CoreAppEnv: IEcsAppEnv;
}

export class ConsumerProjectStack extends Stack implements IConsumerProject {
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

export class ConsumerAccountStack extends Stack implements IConsumerAccount {
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

export class ConsumerAppEnvStack extends Stack implements IConsumerAppEnv {
  readonly Account: ConsumerAccountStack;
  readonly AppEnv: string;
  readonly CoreAppEnv: IAppEnv;

  constructor(account: ConsumerAccountStack, appEnv: string, props?: StackProps) {
    super(account.Project.Scope, `App-${account.Project.Project}-${account.Account}-${appEnv}-AppEnv`, props);

    this.Account = account;
    this.AppEnv = appEnv;
    this.CoreAppEnv = new ImportedAppEnv(this, this.Account.CoreAccount, appEnv);
  }
}

export class ConsumerEcsAppEnvStack extends ConsumerAppEnvStack implements IConsumerEcsAppEnv {
  readonly CoreAppEnv: IEcsAppEnv;

  constructor(account: ConsumerAccountStack, appEnv: string, props?: StackProps) {
    super(account, appEnv, props);

    this.node.tryRemoveChild(this.CoreAppEnv.node.id);

    this.CoreAppEnv = new ImportedEcsAppEnv(this, this.Account.CoreAccount, appEnv);
  }
}

export class ConsumerCiEnvStack extends Stack implements IConsumerEcsAppEnv {
  readonly Account: ConsumerAccountStack;
  readonly AppEnv: string;
  readonly CoreAppEnv: IEcsAppEnv;

  constructor(account: ConsumerAccountStack, props?: StackProps) {
    super(account.Project.Scope, `App-${account.Project.Project}-${account.Account}-CiEnv`, props);

    this.Account = account;
    this.AppEnv = 'Ci';
    this.CoreAppEnv = new ImportedCiEnv(this, this.Account.CoreAccount);
  }
}
