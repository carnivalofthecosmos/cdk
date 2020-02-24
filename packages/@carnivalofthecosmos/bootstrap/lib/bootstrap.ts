import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { Repository, IRepository } from '@aws-cdk/aws-codecommit';
import { CdkPipeline } from '@carnivalofthecosmos/pipeline';
import { RemoteCodeRepo } from '@carnivalofthecosmos/core';
import { RemoteBuildProject } from '@carnivalofthecosmos/core/lib/remote';

export interface IBootstrap extends Construct {
  CdkRepo: IRepository;
  CdkPipeline: CdkPipeline;
}

export interface CoreBootstrapStackProps extends StackProps {}

export class CoreBootstrapStack extends Stack implements IBootstrap {
  readonly CdkRepo: Repository;
  readonly CdkPipeline: CdkPipeline;

  constructor(scope: Construct, props?: CoreBootstrapStackProps) {
    super(scope, `Core-Bootstrap`, props);

    // TODO: Deletion policy ?
    this.CdkRepo = new Repository(this, 'CdkRepo', {
      repositoryName: `core-cdk-repo`,
    });

    this.CdkPipeline = new CdkPipeline(this, 'CdkPipeline', {
      name: 'Core-Cdk-Pipeline',
      cdkRepo: this.CdkRepo,
      deployEnvs: {
        NPM_REGISTRY_API_KEY: { value: 'TODO: Key here' },
      },
      deployStacks: [`Core-*`],
    });

    const addBuildManagedPolicy = (name: string) => {
      this.CdkPipeline.Deploy.role?.addManagedPolicy({ managedPolicyArn: `arn:aws:iam::aws:policy/${name}` });
    };

    // TODO: get the right roles !!
    // addBuildManagedPolicy('AWSCloudFormationFullAccess');
    // addBuildManagedPolicy('AmazonRoute53FullAccess');
    // addBuildManagedPolicy('AmazonECS_FullAccess');
    // addBuildManagedPolicy('AmazonVPCFullAccess');
    // addBuildManagedPolicy('AmazonEC2FullAccess');

    addBuildManagedPolicy('AdministratorAccess'); // FIXME:

    RemoteCodeRepo.export('CoreBootstrap', this.CdkRepo);
    RemoteBuildProject.export(`CoreBootstrap`, this.CdkPipeline.Deploy);
  }
}

export interface ConsumerBootstrapStackProps extends StackProps {}

export class ConsumerBootstrapStack extends Stack implements IBootstrap {
  readonly CdkRepo: Repository;
  readonly CdkPipeline: CdkPipeline;

  constructor(scope: Construct, project: string, props?: CoreBootstrapStackProps) {
    super(scope, `App-${project}-Bootstrap`, props);

    // TODO: Deletion policy ?
    this.CdkRepo = new Repository(this, 'CdkRepo', {
      repositoryName: `app-${project}-cdk-repo`.toLocaleLowerCase(),
    });

    this.CdkPipeline = new CdkPipeline(this, 'CdkPipeline', {
      name: `App-${project}-Cdk-Pipeline`,
      cdkRepo: this.CdkRepo,
      deployEnvs: {
        NPM_REGISTRY_API_KEY: { value: 'TODO: Key here' },
      },
      deployStacks: [`App-${project}-*`],
    });

    const addBuildManagedPolicy = (name: string) => {
      this.CdkPipeline.Deploy.role?.addManagedPolicy({ managedPolicyArn: `arn:aws:iam::aws:policy/${name}` });
    };

    // TODO: get the right roles !!
    // addBuildManagedPolicy('AWSCloudFormationFullAccess');
    // addBuildManagedPolicy('AmazonRoute53FullAccess');
    // addBuildManagedPolicy('AmazonECS_FullAccess');
    // addBuildManagedPolicy('AmazonVPCFullAccess');
    // addBuildManagedPolicy('AmazonEC2FullAccess');

    addBuildManagedPolicy('AdministratorAccess'); // FIXME:

    RemoteCodeRepo.export(`App-${project}-Bootstrap`, this.CdkRepo);
    RemoteBuildProject.export(`App-${project}-Bootstrap`, this.CdkPipeline.Deploy);
  }
}
