export default async promise => {
  try {
    await promise;
    assert.fail('Expected error not received');
  } catch(err) {
    assert.ok(err instanceof Error);
  }
};