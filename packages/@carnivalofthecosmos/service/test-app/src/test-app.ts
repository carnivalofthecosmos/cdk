#!/usr/bin/env node
import 'source-map-support/register';
import { App } from '@aws-cdk/core';
import { ConsumerProjectStack, ConsumerAccountStack } from '@carnivalofthecosmos/core';
import { MyEnvStack } from './env';

const app = new App();

const project = new ConsumerProjectStack(app, 'Ctp');

const account = new ConsumerAccountStack(project, 'Mgt');

const dev = new MyEnvStack(account, 'Dev');

const tst = new MyEnvStack(account, 'Tst');
