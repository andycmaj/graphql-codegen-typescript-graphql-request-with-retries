import polly, { AsyncRetryable } from 'polly-js';

const defaultPolicy = polly()
  .handle(err => {
    return true;
  })
  .waitAndRetry(2);

const withRetryPolicy = <T>(
  action: () => Promise<T>,
  policy: AsyncRetryable = defaultPolicy
) => {
  return policy.executeForPromise(async info => {
    return await action();
  });
};

export default withRetryPolicy;
