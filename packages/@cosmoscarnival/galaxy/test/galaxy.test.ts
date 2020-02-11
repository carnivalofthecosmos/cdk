import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Galaxy = require('../lib/galaxy');
import Cosmos = require('../lib/cosmos');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const cstack = new Cosmos.CosmosStack(app, 'MyCosmosStack')
    const stack = new Galaxy.GalaxyStack(cstack, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
