import { Construct, Stack, StackProps } from '@aws-cdk/core';
import { Repository, IRepository } from '@aws-cdk/aws-codecommit';
import { IPipeline } from '@aws-cdk/aws-codepipeline';
import { CdkPipeline } from "@carnivalofthecosmos/pipeline"

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

    this.CodeRepo = new Repository(this, "CdkRepo", {
      repositoryName: `project-cdk`
    })


    this.CdkPipeline = new CdkPipeline(this, "CdkPipeline", {
      codeRepo: this.CodeRepo
    })
  }
}
