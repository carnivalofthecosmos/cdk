import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import Galaxy = require('../lib/galaxy');

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new Galaxy.GalaxyStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
