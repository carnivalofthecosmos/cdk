import { Construct, Stack, StackProps, CfnOutput, Fn } from '@aws-cdk/core';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';
import { IRepository, Repository } from '@aws-cdk/aws-codecommit';
import { ICoreProject, RemoteZone, RemoteCodeRepo } from '.';

export interface ProjectStackProps extends StackProps {
  tld: string;
}

export class ProjectStack extends Stack implements ICoreProject {
  readonly Scope: Construct;
  readonly Name: string;
  readonly Repo: Repository;
  readonly Zone: HostedZone;

  constructor(app: Construct, name: string, props: ProjectStackProps) {
    super(app, 'Core-Project', props);

    const { tld } = props;

    this.Scope = app;
    this.Name = name;

    this.Repo = new Repository(this, 'CdkRepo', {
      repositoryName: `core-cdk-repo`,
    });

    this.Zone = new HostedZone(this, 'RootZone', {
      zoneName: `${this.Name}.${tld}`.toLowerCase(),
    });

    new CfnOutput(this, 'CoreProject', {
      exportName: `CoreProjectName`,
      value: this.Name,
    });

    RemoteCodeRepo.export('CoreProject', this.Repo);
    RemoteZone.export('CoreProject', this.Zone);
  }
}

export class ImportedProject extends Construct implements ICoreProject {
  readonly Scope: Construct;
  readonly Name: string;
  readonly Repo: IRepository;
  readonly Zone: IHostedZone;

  constructor(scope: Construct) {
    super(scope, 'Core-Project');

    this.Scope = scope;
    this.Name = Fn.importValue('CoreProjectName');
    this.Repo = RemoteCodeRepo.import(this, 'CoreProject', 'CdkRepo');
    this.Zone = RemoteZone.import(this, 'CoreProject', 'RootZone');
  }
}
