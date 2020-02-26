import { Construct } from '@aws-cdk/core';
import { Pipeline, Artifact, StageOptions, IAction } from '@aws-cdk/aws-codepipeline';
import { CodeCommitSourceAction, CodeBuildAction, ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import { RemoteCodeRepo, IConsumerAppEnv, RemoteBuildProject } from '@carnivalofthecosmos/core';
import { IProject, BuildEnvironmentVariableType } from '@aws-cdk/aws-codebuild';

export class AppPipelineBase extends Construct {
  readonly Pipeline: Pipeline;

  private cdkSourceRepoAction: IAction;
  private cdkProject: IProject;

  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  addDeployEnvStage(appEnv: IConsumerAppEnv, props?: { isManualApprovalRequired?: boolean }) {
    const { isManualApprovalRequired = true } = props || {};
    const projectName = appEnv.Account.Project.Name;
    const accountName = appEnv.Account.Name;
    const appEnvName = appEnv.Name;

    if (!this.cdkSourceRepoAction) {
      const cdkRepo = RemoteCodeRepo.import(this, `App${projectName}Bootstrap`, 'CdkRepo');
      const sourceOutput = new Artifact('CdkOutput');
      this.cdkSourceRepoAction = new CodeCommitSourceAction({
        actionName: 'CdkCheckout',
        repository: cdkRepo,
        output: sourceOutput,
      });
      this.Pipeline.stages[0].addAction(this.cdkSourceRepoAction);
    }

    if (!this.cdkProject) {
      this.cdkProject = RemoteBuildProject.import(this, `App${projectName}Bootstrap`, `CdkDeploy`);
    }

    const cdkOutputArtifact = (this.cdkSourceRepoAction?.actionProperties.outputs as Artifact[])[0];

    const deployStage: StageOptions = {
      stageName: `${appEnvName}`,
      actions: [
        new CodeBuildAction({
          actionName: 'CdkDeploy',
          project: this.cdkProject,
          input: cdkOutputArtifact,
          runOrder: 2,
          environmentVariables: {
            STACKS: {
              type: BuildEnvironmentVariableType.PLAINTEXT,
              value: `App-${projectName}-${accountName}-${appEnvName}-*`,
            },
          },
        }),
      ],
    };

    if (isManualApprovalRequired) {
      deployStage.actions?.push(
        new ManualApprovalAction({
          actionName: 'CdkApproval',
          runOrder: 1,
        }),
      );
    }

    this.Pipeline.addStage(deployStage);
  }
}
