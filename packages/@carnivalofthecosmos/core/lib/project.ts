import { App, AppProps, Stack, StackProps, Construct } from '@aws-cdk/core';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';
import { RemoteZone } from '.';

export interface IProject extends Construct {
  App: App;
  Project: string;
  Zone: IHostedZone;
}

export interface ProjectStackProps extends StackProps {
  tld: string;
}

export class ProjectStack extends Stack implements IProject {
  readonly App: App;
  readonly Project: string;
  readonly Zone: HostedZone;

  constructor(app: App, project: string, props: ProjectStackProps) {
    super(app, 'Core-Project', props);

    const { tld } = props;

    this.App = app;
    this.Project = project;

    this.Zone = new HostedZone(this, 'RootZone', {
      zoneName: `${project}.${tld}`.toLowerCase(),
    });

    RemoteZone.export(this.Project, this.Zone);
  }
}

export class ImportedProject extends Construct implements IProject {
  readonly App: App;
  readonly Project: string;
  readonly Zone: IHostedZone;

  constructor(scope: Construct, project: string) {
    super(scope, 'Core-Project');

    this.App = scope.node.scope as App;
    this.Project = project;
    this.Zone = RemoteZone.import(this, this.Project, 'RootZone');
  }
}
