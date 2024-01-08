import path from 'path';
import os from 'os';
import nock from 'nock';
import { mkdtemp, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'url';
import loadResourse from '../src/loadResourse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockUrl = 'https://ru.hexlet.io';
let tempDir;

beforeEach(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

test.each([
  ['ru-hexlet-io-courses.html', '/courses', 'json'],
  ['ru-hexlet-io-packs-js-runtime.js', '/packs/js/runtime.js', 'json'],
  ['ru-hexlet-io-assets-application.css', '/assets/application.css', 'json'],
  ['ru-hexlet-io-assets-professions-nodejs.png', '/assets/professions/nodejs.png', 'arraybuffer'],
])('loadResourse of a %p file from %p', async (fileName, uri, responseType) => {
  const samplePath = path.join(__dirname, '..', '__fixtures__', fileName);
  const sample = await readFile(samplePath, 'utf8');
  nock(mockUrl).get(uri).replyWithFile(200, samplePath, {
    'Content-Type': responseType,
  });
  const filePath = path.join(tempDir, fileName);
  await loadResourse(`${mockUrl}${uri}`, filePath, responseType);
  await expect(readFile(filePath, 'utf-8')).resolves.toStrictEqual(sample);
});

// test('loardResourse fails with error, when response status code is not 200', async () => {
//   const statusCode = 404;
//   const errorMessage = `Loading resourse from ${mockUrl} ended with status ${statusCode}`;
//   nock(mockUrl).get('/').reply(statusCode, '');
//   await expect(loadResourse(mockUrl, '')).rejects.toThrow(errorMessage);
// });

// test('loardResourse fails with error, when path doesnt exist', async () => {
//   const invalidPath = 'this/path/doesnt/exist';
//   nock(mockUrl).get('/').reply(200, '');
//   await expect(loadResourse(mockUrl, invalidPath)).rejects.toThrow(`Error: ENOENT: no such file or directory, open '${invalidPath}'`);
// });

// test('loardResourse fails with error, when there is no write permission', async () => {
//   const invalidPath = path.join(__dirname, '..', '__fixtures__', 'noWritePermission');
//   nock(mockUrl).get('/').reply(200, '');
//   await expect(loadResourse(mockUrl, invalidPath)).rejects.toThrow(`Error: EISDIR: illegal operation on a directory, open '${invalidPath}'`);
// });
