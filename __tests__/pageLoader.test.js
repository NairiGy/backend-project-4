import path from 'path';
import os from 'os';
import nock from 'nock';
import { mkdtemp, readFile } from 'node:fs/promises';
import pageLoader from '../src/pageLoader.js';

const mockUrl = 'http://www.test.com';
const mockData = 'abc';
let tempDir;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test('fileName is correctly made', async () => {
  nock(mockUrl).get('/').reply(200, mockData);
  const fileName = 'www-test-com.html';
  const pagePathExpected = `${tempDir}/${fileName}`;

  await expect(pageLoader(mockUrl, tempDir)).resolves.toEqual(pagePathExpected);
});

test('data is correcly loaded', async () => {
  nock(mockUrl).get('/').reply(200, mockData);
  const pathActual = await pageLoader(mockUrl, tempDir);
  await expect(readFile(pathActual, 'utf-8')).resolves.toEqual(mockData);
});
