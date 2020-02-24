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
  Name: string;
  CoreProject: IProject;
}

export interface IConsumerAccount extends Construct {
  Project: IConsumerProject;
  Name: string;
  CoreAccount: IAccount;
}

export interface IConsumerAppEnv extends Construct {
  Account: IConsumerAccount;
  Name: string;
  CoreAppEnv: IAppEnv;
}

export interface IConsumerEcsAppEnv extends Construct {
  Account: IConsumerAccount;
  Name: string;
  CoreAppEnv: IEcsAppEnv;
}

export class ConsumerProjectStack extends Stack implements IConsumerProject {
  readonly Scope: Construct;
  readonly Name: string;
  readonly CoreProject: IProject;

  constructor(scope: Construct, name: string, props?: StackProps) {
    super(scope, `App-${name}-Project`, props);

    this.Scope = scope;
    this.Name = name;
    this.CoreProject = new ImportedProject(this);
  }
}

export class ConsumerAccountStack extends Stack implements IConsumerAccount {
  readonly Project: ConsumerProjectStack;
  readonly Name: string;
  readonly CoreAccount: IAccount;

  constructor(project: ConsumerProjectStack, name: string, props?: StackProps) {
    super(project.Scope, `App-${project.Name}-${name}-Account`, props);

    this.Project = project;
    this.Name = name;
    this.CoreAccount = new ImportedAccount(this, this.Project.CoreProject, name);
  }
}

export class ConsumerAppEnvStack extends Stack implements IConsumerAppEnv {
  readonly Account: ConsumerAccountStack;
  readonly Name: string;
  readonly CoreAppEnv: IAppEnv;

  constructor(account: ConsumerAccountStack, name: string, props?: StackProps) {
    super(account.Project.Scope, `App-${account.Project.Name}-${account.Name}-${name}-AppEnv`, props);

    this.Account = account;
    this.Name = name;
    this.CoreAppEnv = new ImportedAppEnv(this, this.Account.CoreAccount, this.Name);
  }
}

export class ConsumerEcsAppEnvStack extends ConsumerAppEnvStack implements IConsumerEcsAppEnv {
  readonly CoreAppEnv: IEcsAppEnv;

  constructor(account: ConsumerAccountStack, name: string, props?: StackProps) {
    super(account, name, props);

    this.node.tryRemoveChild(this.CoreAppEnv.node.id);

    this.CoreAppEnv = new ImportedEcsAppEnv(this, this.Account.CoreAccount, this.Name);
  }
}

export class ConsumerCiEnvStack extends Stack implements IConsumerEcsAppEnv {
  readonly Account: ConsumerAccountStack;
  readonly Name: string;
  readonly CoreAppEnv: IEcsAppEnv;

  constructor(account: ConsumerAccountStack, props?: StackProps) {
    super(account.Project.Scope, `App-${account.Project.Name}-${account.Name}-CiEnv`, props);

    this.Account = account;
    this.Name = 'Ci';
    this.CoreAppEnv = new ImportedCiEnv(this, this.Account.CoreAccount);
  }
}
