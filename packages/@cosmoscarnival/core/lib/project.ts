import { App, AppProps, Stack, StackProps } from '@aws-cdk/core';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';
import { CORE_TLD } from '.';

export interface ProjectAppProps extends AppProps, StackProps {
  tld: string;
}

export class ProjectApp extends App {
  readonly stack: Stack;
  readonly project: string;
  readonly zone: HostedZone;

  constructor(project: string, props: ProjectAppProps) {
    const { tld, context, ...remaining } = props;
    super({
      ...remaining,
      context: {
        ...context,
        [CORE_TLD]: tld,
      },
    });

    this.stack = new Stack(this, 'Core', props);
    this.project = project;

    this.zone = new HostedZone(this.stack, 'SharedZone', {
      zoneName: `${project}.${tld}`.toLowerCase(),
    });
  }
}
