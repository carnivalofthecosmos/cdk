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

    this.CodeRepo = new Repository(this, 'CoreCdkRepo', {
      repositoryName: `core-project-cdk`, // TODO: core-cdk-repo
    });

    this.CdkPipeline = new CdkPipeline(this, 'CoreCdkPipeline', {
      codeRepo: this.CodeRepo,
      buildEnvs: {
        NPM_REGISTRY_API_KEY: { value: 'TODO: Key here' },
      },
    });

    const buildRole = this.CdkPipeline.Build.role;
    if (!buildRole) throw new Error('Build role required.');
    buildRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyName(this, 'CfAccess', 'AWSCloudFormationFullAccess'));
    buildRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyName(this, 'Route53Access', 'AmazonRoute53FullAccess'));
    buildRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyName(this, 'EcsAccess', 'AmazonECS_FullAccess'));
    buildRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyName(this, 'VpcAccess', 'AmazonVPCFullAccess'));
    buildRole.addManagedPolicy(ManagedPolicy.fromManagedPolicyName(this, 'Ec2Access', 'AmazonEC2FullAccess'));
  }
}
