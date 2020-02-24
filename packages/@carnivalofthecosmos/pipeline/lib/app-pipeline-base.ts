import { Construct } from '@aws-cdk/core';
import { Pipeline, Artifact, StageOptions } from '@aws-cdk/aws-codepipeline';
import { CodeCommitSourceAction, CodeBuildAction, ManualApprovalAction } from '@aws-cdk/aws-codepipeline-actions';
import { RemoteCodeRepo, IConsumerAppEnv, RemoteBuildProject } from '@carnivalofthecosmos/core';

export class AppPipelineBase extends Construct {
  readonly Pipeline: Pipeline;

  constructor(scope: Construct, id: string) {
    super(scope, id);
  }

  addDeployEnvStage(appEnv: IConsumerAppEnv, { isManualApprovalRequired = false }) {
    const project = appEnv.Account.Project.Project;

    let cdkSourceRepoAction = this.Pipeline.stages[0].actions.find(
      action => action.actionProperties.actionName == 'CdkCheckout',
    );

    if (!cdkSourceRepoAction) {
      const project = appEnv.Account.Project.Project;
      const cdkRepo = RemoteCodeRepo.import(this, `App-${project}-Bootstrap`, 'AppCdkRepo');
      const sourceOutput = new Artifact('CdkOutput');
      cdkSourceRepoAction = new CodeCommitSourceAction({
        actionName: 'CdkCheckout',
        repository: cdkRepo,
        output: sourceOutput,
      });
      this.Pipeline.stages[0].addAction(cdkSourceRepoAction);
    }

    const cdkProject = RemoteBuildProject.import(this, `App-${project}-Bootstrap`, `Deploy${appEnv.AppEnv}`);
    const cdkOutputArtifact = (cdkSourceRepoAction?.actionProperties.outputs as Artifact[])[0];

    const deployStage: StageOptions = {
      stageName: `${appEnv.AppEnv}`,
      actions: [
        new CodeBuildAction({
          actionName: 'CdkDeploy',
          project: cdkProject,
          input: cdkOutputArtifact,
          runOrder: 2,
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
