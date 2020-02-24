#!/usr/bin/env node
import 'source-map-support/register';
import { StackProps } from '@aws-cdk/core';
import { ConsumerAccountStack, ConsumerEcsAppEnvStack } from '@carnivalofthecosmos/core';
import { Repository } from '@aws-cdk/aws-ecr';
import { ContainerImage } from '@aws-cdk/aws-ecs';
import { EcsService } from '../../lib';

export interface MyEnvStackProps extends StackProps {}

export class MyEnvStack extends ConsumerEcsAppEnvStack {
  constructor(account: ConsumerAccountStack, appEnv: string, props?: MyEnvStackProps) {
    super(account, appEnv, props);

    const ecr = Repository.fromRepositoryName(this, 'ecr', 'cdk/test');

    new EcsService(this, 'Frontend', {
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
