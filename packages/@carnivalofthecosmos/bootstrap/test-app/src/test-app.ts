#!/usr/bin/env node
import 'source-map-support/register';
import { App, Stack } from '@aws-cdk/core';
import { CoreBootstrapStack } from '../../lib';

const app = new App();

new CoreBootstrapStack(app)

