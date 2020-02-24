import { Construct, RemovalPolicy, PhysicalName } from '@aws-cdk/core';
import { Bucket, BucketEncryption } from '@aws-cdk/aws-s3';
import { IRepository } from '@aws-cdk/aws-codecommit';
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeCommitSourceAction, CodeBuildAction, CodeCommitTrigger } from '@aws-cdk/aws-codepipeline-actions';
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
  cdkRepo: IRepository;
  cdkBranch?: string;
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
      cdkRepo,
      cdkBranch = 'master',
      deployRole = undefined,
      deployEnvs = undefined,
      deployStacks = [],
    } = props;

    const artifactBucket = new Bucket(this, 'CdkArtifactBucket', {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.Deploy = new Project(this, 'Deploy', {
      projectName: `${name}Deploy`,
      role: deployRole,
      source: Source.codeCommit({
        repository: cdkRepo,
        branchOrRef: cdkBranch,
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
            commands: ['npx cdk synth ${STACKS}', 'npx cdk diff ${STACKS}', 'npx cdk deploy ${STACKS}'],
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
        path: 'CodeBuild',
        includeBuildId: true,
        name: 'cdk.templates',
        packageZip: true,
      }),
    });

    const sourceOutput = new Artifact('CdkCodeOutput');
    const cdkDeployOutput = new Artifact('CdkDeployOutput');

    this.Pipeline = new Pipeline(this, 'Pipeline', {
      pipelineName: name,
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new CodeCommitSourceAction({
              actionName: 'CdkCheckout',
              repository: cdkRepo,
              branch: cdkBranch,
              output: sourceOutput,
              trigger: CodeCommitTrigger.NONE,
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new CodeBuildAction({
              actionName: 'CdkDeploy',
              project: this.Deploy,
              input: sourceOutput,
              outputs: [cdkDeployOutput],
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
