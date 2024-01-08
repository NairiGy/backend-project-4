import axios from 'axios';
import fs from 'node:fs';
import debug from 'debug';
import { pipeline } from 'node:stream/promises';

const logAxios = debug('axios');

/**
 * @function loadResourse
 * Loads resourse from utl to local path
 * @param {string} url - url string of a resourse
 * @param {string} path - directory to load
 * @returns {Promise}
 */
export default (url, path) => {
  logAxios(`Starting loading from ${url} to ${path}`);
  return axios({
    method: 'get',
    url,
    responseType: 'stream',
    validateStatus: (status) => status === 200,
  })
    .then(({ data }) => {
      logAxios(`Streaming data to ${path} from ${url}`);
      return pipeline(data, fs.createWriteStream(path));
    });
};
