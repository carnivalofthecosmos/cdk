#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { ProjectStack, AccountStack, EcsAppEnvStack } from '../../lib/index';

const app = new App();

const projectStack = new ProjectStack(app, 'Devops', {
  tld: 'carnivalofthecosmos.com',
});

const mgtAccount = new AccountStack(projectStack, 'Mgt');

const devEcsAppEnv = new EcsAppEnvStack(mgtAccount, 'Dev');

const tstAppEnv = new EcsAppEnvStack(mgtAccount, 'Tst');
