const nock = require('nock');
const test = require('ava');

const requestToken = require('../lib/request-token');

const tokenEndpoint = 'https://tokens.indieauth.com/token';

test.before(t => {
  t.context.bearer = 'JWT';
  t.context.opts = {tokenEndpoint};
});

test('Returns an access token', async t => {
  // Setup
  const scope = nock(tokenEndpoint).get('')
    .reply(200, {
      client_id: 'https://client.example/',
      scope: 'create update delete media'
    });
  const accessToken = await requestToken(t.context.opts, t.context.bearer);

  // Test assertions
  t.is(String(accessToken.client_id), 'https://client.example/');
  scope.done();
});

test('Throws error if no access token provided', async t => {
  const error = await t.throwsAsync(requestToken(t.context.opts, null));
  t.is(error.message, 'No token provided in request');
});

test('Throws error if token endpoint returns an error', async t => {
  // Setup
  const scope = nock(tokenEndpoint).get('')
    .reply(404, {
      error: 'Invalid request',
      error_description: 'The code provided was not valid'
    });
  const error = await t.throwsAsync(requestToken(t.context.opts, t.context.bearer));

  // Test assertions
  t.is(error.message, 'The code provided was not valid');
  scope.done();
});

test('Throws error if can’t connect to token endpoint', async t => {
  // Setup
  const scope = nock(tokenEndpoint).get('')
    .replyWithError('The code provided was not valid');
  const error = await t.throwsAsync(requestToken(t.context.opts, t.context.bearer));

  // Test assertions
  t.regex(error.message, /^FetchError/);
  scope.done();
});
