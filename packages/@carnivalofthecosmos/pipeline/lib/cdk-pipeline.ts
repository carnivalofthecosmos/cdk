import { Construct, RemovalPolicy, PhysicalName } from '@aws-cdk/core';
import { Bucket, BucketEncryption } from "@aws-cdk/aws-s3";
import { Key } from "@aws-cdk/aws-kms";
import { Repository, IRepository } from '@aws-cdk/aws-codecommit';
import { Pipeline, IPipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import {
  CodeCommitSourceAction,
  CodeBuildAction,
  CloudFormationCreateUpdateStackAction,
} from '@aws-cdk/aws-codepipeline-actions';
import { PipelineProject, BuildSpec, LinuxBuildImage } from '@aws-cdk/aws-codebuild';


export interface CdkPipelineProps {
  codeRepo: IRepository;
  branch?: string;
}

export class CdkPipeline extends Construct {
  readonly Pipeline:Pipeline; 

  constructor(scope: Construct, id: string, props: CdkPipelineProps) {
    super(scope, id);

    const { codeRepo, branch = 'master' } = props;
    // Create a new encrypted bucket and use that to create Pipeline. 
    const EncryptionKey = new Key(this, 'ArtifactEncryptionKey', {
      removalPolicy: RemovalPolicy.RETAIN
    });
    const ArtifactBucket = new Bucket(this, 'PipelineArtifactBucket', {
      bucketName: PhysicalName.GENERATE_IF_NEEDED,
      encryption: BucketEncryption.KMS,
      encryptionKey: EncryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const cdkBuild = new PipelineProject(this, 'CdkBuild', {
      buildSpec: BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '10',
            },
          },
          pre_build: {
            commands: ['npm install'],
          },
          build: {
            commands: ['npm run cdk synth'],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: ['*.template.json'],
        },
      }),
      environment: {
        buildImage: LinuxBuildImage.STANDARD_2_0,
      },
    });

    const sourceOutput = new Artifact();
    const cdkBuildOutput = new Artifact('CdkBuildOutput');

    this.Pipeline = new Pipeline(this, 'Pipeline', {
      artifactBucket: ArtifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new CodeCommitSourceAction({
              actionName: 'Code_Checkout',
              repository: codeRepo,
              branch: branch,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new CodeBuildAction({
              actionName: 'CDK_Build',
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
          ],
        },
      ],
    });
  }
}
