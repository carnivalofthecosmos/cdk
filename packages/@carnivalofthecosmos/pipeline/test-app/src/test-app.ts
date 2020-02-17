#!/usr/bin/env node
import 'source-map-support/register';
import { App, Stack } from '@aws-cdk/core';
import { LibTemplate } from '../../lib/index';

const app = new App();

const stack = new Stack(app, 'test');

new LibTemplate(stack, 'test-lib');
