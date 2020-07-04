import test from 'ava';
import supertest from 'supertest';
import {serverConfig} from '../../../indiekit/config/server.js';
import {Indiekit} from '../../../indiekit/index.js';

const mockResponse = async query => {
  const indiekit = new Indiekit();
  const config = await indiekit.init();
  const request = supertest(serverConfig(config));
  return request.get('/media')
    .set('Accept', 'application/json')
    .query(query);
};

test('Returns last file uploaded', async t => {
  const response = await mockResponse('q=last');
  t.truthy(response.body);
});

test('Returns 400 if unsupported parameter provided', async t => {
  const response = await mockResponse('q=foobar');
  t.is(response.status, 400);
  t.regex(response.error.text, /\bInvalid parameter: foobar\b/);
});

test('Returns 400 if unsupported query provided', async t => {
  const response = await mockResponse('foo=bar');
  t.is(response.status, 400);
  t.regex(response.error.text, /\bInvalid query\b/);
});

test('Returns 400 if request is missing query string', async t => {
  const response = await mockResponse(false);
  t.is(response.status, 400);
  t.regex(response.error.text, /\bInvalid query\b/);
});