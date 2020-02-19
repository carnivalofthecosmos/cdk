import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { Repository, IRepository } from '@aws-cdk/aws-codecommit';
import { CdkPipeline } from '@carnivalofthecosmos/pipeline';
import { ManagedPolicy } from '@aws-cdk/aws-iam';

export interface IBootstrap extends Construct {
  CodeRepo: IRepository;
  CdkPipeline: CdkPipeline;
}

export interface CoreBootstrapStackProps extends StackProps {}

export class CoreBootstrapStack extends Stack implements IBootstrap {
  readonly CodeRepo: IRepository;
  readonly CdkPipeline: CdkPipeline;

  constructor(scope: Construct, props?: CoreBootstrapStackProps) {
    super(scope, `Core-Bootstrap`, props);

    // TODO: Deletion policy ?
    this.CodeRepo = new Repository(this, 'CoreCdkRepo', {
      repositoryName: `core-cdk-repo`,
    });

    this.CdkPipeline = new CdkPipeline(this, 'CoreCdkPipeline', {
      codeRepo: this.CodeRepo,
      buildEnvs: {
        NPM_REGISTRY_API_KEY: { value: 'TODO: Key here' },
      },
    });

    const addBuildManagedPolicy = (name: string) => {
      this.CdkPipeline.Build.role?.addManagedPolicy({ managedPolicyArn: `arn:aws:iam::aws:policy/${name}` });
    };

    // TODO: get the right roles !!
    // addBuildManagedPolicy('AWSCloudFormationFullAccess');
    // addBuildManagedPolicy('AmazonRoute53FullAccess');
    // addBuildManagedPolicy('AmazonECS_FullAccess');
    // addBuildManagedPolicy('AmazonVPCFullAccess');
    // addBuildManagedPolicy('AmazonEC2FullAccess');

    addBuildManagedPolicy('AdministratorAccess'); // FIXME:
  }
}

export interface ConsumerBootstrapStackProps extends StackProps {}

export class ConsumerBootstrapStack extends Stack implements IBootstrap {
  readonly CodeRepo: IRepository;
  readonly CdkPipeline: CdkPipeline;

  constructor(scope: Construct, project: string, props?: CoreBootstrapStackProps) {
    super(scope, `App-${project}-Bootstrap`, props);

    // TODO: Deletion policy ?
    this.CodeRepo = new Repository(this, 'AppCdkRepo', {
      repositoryName: `app-${project}-cdk-repo`.toLocaleLowerCase(),
    });

    this.CdkPipeline = new CdkPipeline(this, 'AppCdkPipeline', {
      name: `${project}CdkPipeline`,
      codeRepo: this.CodeRepo,
      buildEnvs: {
        NPM_REGISTRY_API_KEY: { value: 'TODO: Key here' },
      },
    });

    const addBuildManagedPolicy = (name: string) => {
      this.CdkPipeline.Build.role?.addManagedPolicy({ managedPolicyArn: `arn:aws:iam::aws:policy/${name}` });
    };

    // TODO: get the right roles !!
    // addBuildManagedPolicy('AWSCloudFormationFullAccess');
    // addBuildManagedPolicy('AmazonRoute53FullAccess');
    // addBuildManagedPolicy('AmazonECS_FullAccess');
    // addBuildManagedPolicy('AmazonVPCFullAccess');
    // addBuildManagedPolicy('AmazonEC2FullAccess');

    addBuildManagedPolicy('AdministratorAccess'); // FIXME:
  }
}
