#!/usr/bin/env node
import 'source-map-support/register';
import { App, Stack } from '@aws-cdk/core';
import { ProjectApp, AccountStack, AppEnvStack, EcsAppEnvStack, EcsServiceStack, EcsServiceStackProps } from '../../lib/index';

const projectApp = new ProjectApp('devops', {
  tld: 'cosmoscarnival.com',
});

const mgtAccount = new AccountStack(projectApp, 'Mgt');

const devEcsAppEnv = new EcsAppEnvStack(mgtAccount, 'Dev');
const tstAppEnv = new AppEnvStack(mgtAccount, 'Tst');
const ecsSvc = new EcsServiceStack(projectApp, 'MySvc', {
  ecsEnv: devEcsAppEnv,
})

///// Client

// const project = ProjectApp.fromExisting('devops');
// const account = AccountStack.fromExisting(project, 'Mgt');
// const devEnv = AppEnv.fromExisting('devops', 'mgt', 'dev');
// const workload = new Workload(devEnv, 'MyWorkload', {
//   image: '',
// });

// const newAppEnv = new AccountStack(account, 'newenv');
