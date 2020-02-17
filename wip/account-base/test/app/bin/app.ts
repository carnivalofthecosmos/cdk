#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { AppStack } from '../lib/app-stack';

//import AccountBase = require('../../lib/index');
import AccountBase = require('../../../lib/index');
import StackBuilder = require('../../../../stack-builder/lib/index');

import { STATUS_CODES } from 'http';
import { ContextProvider } from '@aws-cdk/core';

const app = new cdk.App();

const zoneInfo = app.node.tryGetContext("zoneInfo");
// TODO: more validation || type here for zoneInfo
if(!zoneInfo) { throw new Error('Need zoneInfo to be set in context'); }

const accountType = app.node.tryGetContext("accountType");
// TODO: more validation || type here for accountType
if(!accountType) { throw new Error('Need accountType to be set in context'); }

StackBuilder.ContextBuilder(app.node, {});

const project = app.node.tryGetContext("project");
const application = app.node.tryGetContext("application");
const version = app.node.tryGetContext("version");

console.log(zoneInfo.baseTld);

new StackBuilder.StackBuilderStack(app, 'AccountStack', {
    longDescription: 'This template is the nested stack engine and controller for the base account',
    project,
    version,
    application,
  });

