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

# Unit test

```typescript
import nock from 'nock';
import graphqlClient from 'shared/graphqlClient';

describe('graphqlClient', () => {
  beforeAll(() => nock.disableNetConnect());
  afterAll(() => nock.enableNetConnect());
  afterEach(() => nock.cleanAll());

  it('retries twice when ETIMEDOUT', async () => {
    nock(/localhost|botany-db/)
      .post('/v1/graphql')
      .replyWithError({ code: 'ETIMEDOUT', message: 'connect ETIMEDOUT' });

    nock(/localhost|botany-db/)
      .post('/v1/graphql')
      .replyWithError({ code: 'ETIMEDOUT', message: 'connect ETIMEDOUT' });

    nock(/localhost|botany-db/)
      .post('/v1/graphql')
      .replyWithError({ code: 'ETIMEDOUT', message: 'connect ETIMEDOUT' });

    try {
      await graphqlClient.GetDataSource({
        dataSourceId: 'github',
      });
    } catch (e) {
      console.log('LAST ERROR', e, e.stack);
    }
  });
});
```
