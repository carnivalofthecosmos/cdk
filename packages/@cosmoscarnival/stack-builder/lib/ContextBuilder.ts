import * as cdk from '@aws-cdk/core';

interface Dictionary {
    [key: string]: any;
  }

export interface ContextBuilderProps {
    context?: Dictionary;
}

export const ContextBuilder = ( node: cdk.ConstructNode, props: ContextBuilderProps ) => {
    const project = node.tryGetContext("project");
    if(!project) { throw new Error('Need project to be set in context'); }
    
    const application = node.tryGetContext("application");
    if(!application) { throw new Error('Need application to be set in context'); }
    
    const version = node.tryGetContext("version");
    if(!version) { throw new Error('Need version to be set in context'); }
    
}