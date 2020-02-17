#!/usr/bin/env node
import 'source-map-support/register';
import { App, Construct } from '@aws-cdk/core';
import { ConsumerStack, ConsumerStackProps } from '@carnivalofthecosmos/core/lib';
import { Repository } from '@aws-cdk/aws-ecr';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { EcsService } from '../../lib/index';

const app = new App();

interface MyServiceProps extends ConsumerStackProps {}

class MyServiceStack extends ConsumerStack {
  constructor(scope: Construct, project: string, account: string, appEnv: string, props?: MyServiceProps) {
    super(scope, project, account, appEnv, 'MyService', props);

    const ecr = Repository.fromRepositoryName(this, 'ecr', 'cdk/test');

    new EcsService(this, 'Test', {
      ecsAppEnv: this.Env,
      container: {
        image: ContainerImage.fromEcrRepository(ecr, 'latest'),
      },
      service: {},
      routing: {
        pathPattern: '/test',
        priority: 1,
      },
    });
  }
}

new MyServiceStack(app, 'Devops', 'Mgt', 'Dev');

new MyServiceStack(app, 'Devops', 'Mgt', 'Tst');

// const dev = new CtpStack(devEnv, {
//     version:"1.5"
// })

// const tst = new CtpStack(tstEnv, {
//     version: project.context("VERSION", "1.2")
//     env:{
//         ...commonEnv
//         bla:""
//     }
// })
