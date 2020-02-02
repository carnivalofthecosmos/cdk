#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AppStack } from '../lib/app-stack';

import LibTemplate = require('../../../lib/index');


const app = new cdk.App();
new AppStack(app, 'AppStack');
