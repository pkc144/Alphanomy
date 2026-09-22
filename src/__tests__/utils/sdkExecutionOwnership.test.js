import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.resolve(__dirname, '../../components/AdviceScreenComponents/RebalanceModal.js'),
  'utf8',
);

describe('SDK rebalance execution ownership', () => {
  test('an SDK rejection joins the common error handler and releases loading', () => {
    expect(source).toMatch(/sdkExecutionError\s*=\s*sdkErr/);
    expect(source).toMatch(
      /sdkExecutionError\s*\n?\s*\? Promise\.reject\(sdkExecutionError\)/,
    );
  });

  test('the reviewed basket is never retried through the legacy endpoint', () => {
    expect(source).toMatch(/SDK owns this attempt; legacy fallback blocked/);
  });
});
