# -graphql-codegen-typescript-graphql-request-with-retries
forked from @graphql-codegen/typescript-graphql-request with additional retry handling for requests

# example of using the generated SDK with a retry policy from [`polly-js`](https://github.com/mauricedb/polly-js).

```typescript
import { GraphQLClient } from 'graphql-request';
import { getSdk } from './generated/types';
import { ASTNode, print } from 'graphql';
import { Variables } from 'graphql-request/dist/src/types';
import { RetryWrapper } from 'typescript-graphql-request-with-retries';
import polly from 'polly-js';

const client = new GraphQLClient(process.env.GRAPHQL_URL, {
  headers: {
    'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET,
  },
});

export const request = <T>(query: ASTNode, variables?: Variables) =>
  client.request<T>(print(query), variables);

const withRetries: RetryWrapper = <T>(action: () => Promise<T>) =>
  polly()
    .handle((err: Error) => {
      console.log('HANDLE', err.message);
      return err.message.includes('connect ETIMEDOUT');
    })
    .waitAndRetry(3)
    .executeForPromise(info => {
      console.log('RETRY', info);
      return action();
    });

const sdk = getSdk(client, withRetries);

export default sdk;
```
