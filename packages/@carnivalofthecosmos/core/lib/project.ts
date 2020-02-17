import { Construct, Stack, StackProps, CfnOutput, Fn } from '@aws-cdk/core';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';
import { RemoteZone } from '.';

export interface IProject extends Construct {
  Scope: Construct;
  Project: string;
  Zone: IHostedZone;
}

export interface ProjectStackProps extends StackProps {
  tld: string;
}

export class ProjectStack extends Stack implements IProject {
  readonly Scope: Construct;
  readonly Project: string;
  readonly Zone: HostedZone;

  constructor(app: Construct, project: string, props: ProjectStackProps) {
    super(app, 'Core-Project', props);

    const { tld } = props;

    this.Scope = app;
    this.Project = project;

    this.Zone = new HostedZone(this, 'RootZone', {
      zoneName: `${project}.${tld}`.toLowerCase(),
    });

    new CfnOutput(this, 'CoreProject', {
      exportName: `CoreProjectName`,
      value: this.Project,
    });
    RemoteZone.export('CoreProject', this.Zone);
  }
}

export class ImportedProject extends Construct implements IProject {
  readonly Scope: Construct;
  readonly Project: string;
  readonly Zone: IHostedZone;

  constructor(scope: Construct) {
    super(scope, 'Core-Project');

    this.Scope = scope;
    this.Project = Fn.importValue('CoreProjectName');
    this.Zone = RemoteZone.import(this, 'CoreProject', 'RootZone');
  }
}
