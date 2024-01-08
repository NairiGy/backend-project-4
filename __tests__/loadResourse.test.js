import path from 'path';
import os from 'os';
import nock from 'nock';
import fsp from 'node:fs/promises';
import { fileURLToPath } from 'url';
import loadResourse from '../src/loadResourse.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockUrl = 'https://ru.hexlet.io';
let tempDir;

beforeEach(async () => {
  tempDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
});

describe('loadResourse function', () => {
  it.each([
    ['ru-hexlet-io-courses.html', '/courses'],
    ['ru-hexlet-io-packs-js-runtime.js', '/packs/js/runtime.js'],
    ['ru-hexlet-io-assets-application.css', '/assets/application.css'],
    ['ru-hexlet-io-assets-professions-nodejs.png', '/assets/professions/nodejs.png'],
  ])('should load %p file from %p', async (fileName, uri) => {
    const samplePath = path.join(__dirname, '..', '__fixtures__', fileName);
    const sample = await fsp.readFile(samplePath, 'utf8');
    nock(mockUrl).get(uri).replyWithFile(200, samplePath);
    const filePath = path.join(tempDir, fileName);
    await loadResourse(`${mockUrl}${uri}`, filePath);
    await expect(fsp.readFile(filePath, 'utf-8')).resolves.toStrictEqual(sample);
  });

  it('should fail when response status code is not 200', async () => {
    const statusCode = 403;
    const errorMessage = `Request failed with status code ${statusCode}`;
    nock(mockUrl).get('/').reply(statusCode, '');
    await expect(loadResourse(mockUrl, '')).rejects.toThrow(errorMessage);
  });

  it('should fail when path doesnt exist', async () => {
    const invalidPath = 'this/path/doesnt/exist';
    const errorMessage = `ENOENT: no such file or directory, open '${invalidPath}'`;
    nock(mockUrl).get('/').reply(200, '');
    await expect(loadResourse(mockUrl, invalidPath)).rejects.toThrow(errorMessage);
  });

  test('should fail when there is no write permission', async () => {
    const noPermissionDir = path.join(__dirname, '..', '__fixtures__', 'noWritePermission');
    const errorMessage = `EISDIR: illegal operation on a directory, open '${noPermissionDir}'`;
    nock(mockUrl).get('/').reply(200, '');
    await expect(loadResourse(mockUrl, noPermissionDir)).rejects.toThrow(errorMessage);
  });
});
