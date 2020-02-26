import { Construct, RemovalPolicy } from '@aws-cdk/core';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { IRepository } from '@aws-cdk/aws-codecommit';
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeCommitSourceAction, CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import { Project, BuildSpec, LinuxBuildImage, BuildEnvironmentVariable, Source } from '@aws-cdk/aws-codebuild';
import { IRole } from '@aws-cdk/aws-iam';

export interface BuildEnvironmentVariables {
  [key: string]: BuildEnvironmentVariable;
}

export interface AppNodePipelineProps {
  name?: string;
  codeRepo: IRepository;
  codeBranch?: string;
  buildRole?: IRole;
  buildEnvs?: BuildEnvironmentVariables;
  buildCommands?: string[];
}

export class AppNodePipeline extends Construct {
  readonly Build: Project;
  readonly Pipeline: Pipeline;

  constructor(scope: Construct, id: string, props: AppNodePipelineProps) {
    super(scope, id);

    const {
      name = id,
      codeRepo,
      codeBranch = 'master',
      buildRole = undefined,
      buildEnvs = undefined,
      buildCommands = ['npm run build'],
    } = props;

    const artifactBucket = new Bucket(this, 'CodeArtifactBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN, // TODO:?
    });

    this.Build = new Project(this, 'Build', {
      projectName: `${name}Build`,
      role: buildRole,
      source: Source.codeCommit({
        repository: codeRepo,
        branchOrRef: codeBranch,
      }),
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '12',
            },
          },
          pre_build: {
            commands: ['$(aws ecr get-login --no-include-email)', 'npm ci'],
          },
          build: {
            commands: buildCommands,
          },
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_3_0,
        environmentVariables: buildEnvs,
        privileged: true,
      },
    });

    const sourceOutput = new Artifact('CodeOutput');

    this.Pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: name,
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new CodeCommitSourceAction({
              actionName: 'CodeCheckout',
              repository: codeRepo,
              branch: codeBranch,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'CodeBuild',
              project: this.Build,
              input: sourceOutput,
            }),
          ],
        },
      ],
    });
  }
}
