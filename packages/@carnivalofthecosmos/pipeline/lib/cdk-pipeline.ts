import { Construct, RemovalPolicy, PhysicalName } from '@aws-cdk/core';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { Key } from '@aws-cdk/aws-kms';
import { IRepository } from '@aws-cdk/aws-codecommit';
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeCommitSourceAction, CodeBuildAction } from '@aws-cdk/aws-codepipeline-actions';
import {
  Project,
  BuildSpec,
  LinuxBuildImage,
  BuildEnvironmentVariable,
  Source,
  Artifacts,
  BuildEnvironmentVariableType,
} from '@aws-cdk/aws-codebuild';
import { IRole } from '@aws-cdk/aws-iam';

export interface BuildEnvironmentVariables {
  [key: string]: BuildEnvironmentVariable;
}

export interface CdkPipelineProps {
  name?: string;
  codeRepo: IRepository;
  codeBranch?: string;
  deployRole?: IRole;
  deployEnvs?: BuildEnvironmentVariables;
  deployStacks?: string[];
}

export class CdkPipeline extends Construct {
  readonly Deploy: Project;
  readonly Pipeline: Pipeline;

  constructor(scope: Construct, id: string, props: CdkPipelineProps) {
    super(scope, id);

    const {
      name = id,
      codeRepo,
      codeBranch = 'master',
      deployRole = undefined,
      deployEnvs = undefined,
      deployStacks = [],
    } = props;

    const artifactBucket = new Bucket(this, 'CdkArtifactBucket', {
      bucketName: PhysicalName.GENERATE_IF_NEEDED,
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.Deploy = new Project(this, 'Deploy', {
      projectName: `${name}Deploy`,
      role: deployRole,
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
            commands: ['npm install'],
          },
          build: {
            commands: ['npx cdk synth', 'npx cdk diff', 'npx cdk deploy'],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: ['*.template.json'],
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_3_0,
        environmentVariables: {
          ...deployEnvs,
          STACKS: {
            type: BuildEnvironmentVariableType.PLAINTEXT,
            value: '',
          },
        },
      },
      artifacts: Artifacts.s3({
        bucket: artifactBucket,
        name: 'cdk.templates',
        packageZip: true,
        includeBuildId: true,
      }),
    });

    const sourceOutput = new Artifact('CdkCodeOutput');
    const cdkBuildOutput = new Artifact('CdkBuildOutput');

    this.Pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: name,
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new CodeCommitSourceAction({
              actionName: 'Code_Checkout',
              repository: codeRepo,
              branch: codeBranch,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new CodeBuildAction({
              actionName: 'CDK_Deploy',
              project: this.Deploy,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
              environmentVariables: {
                STACKS: {
                  type: BuildEnvironmentVariableType.PLAINTEXT,
                  value: deployStacks.join(''),
                },
              },
            }),
          ],
        },
      ],
    });
  }
}
