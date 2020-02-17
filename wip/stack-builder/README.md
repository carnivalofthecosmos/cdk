# Welcome to your CDK TypeScript Construct Library project!

You should explore the contents of this project. It demonstrates a CDK Construct Library that includes a construct (`StackBuilder`)
which contains an Amazon SQS queue that is subscribed to an Amazon SNS topic.

The construct defines an interface (`StackBuilderProps`) to configure the visibility timeout of the queue.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests

 Mac post copy

 `find . -type f -exec sed -i '' -e  's/StackBuilder/AccountBearer/g' {} \;\n`

 `find . -type f -exec sed -i '' -e  's/stack-builer/account-bearer/g' {} \;\n`
