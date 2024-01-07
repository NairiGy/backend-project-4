import axios from 'axios';
import { writeFile } from 'fs/promises';
import debug from 'debug';

const logAxios = debug('axios');

/**
 * Downloads a file from url to the given path
 * @param {*} url
 * @param {*} path
 * @param {*} responseType
 * @returns {Promise} Fulfills with the file content upon success
 */
export default (url, path, responseType = 'json') => new Promise((resolve, reject) => {
  logAxios(`Loading from ${url} to ${path}`);
  let content;
  axios({
    method: 'get',
    url,
    responseType,
    validateStatus: (status) => status === 200,
  })
    .then((response) => {
      logAxios(`GET with response status ${response.status} for ${url}`);
      content = response.data;
      if (responseType === 'arraybuffer') {
        return writeFile(path, Buffer.from(content));
      }
      if (typeof content === 'object') {
        content = JSON.stringify(content);
      }
      return writeFile(path, content);
    })
    .then(() => resolve(content))
    .catch((e) => {
      logAxios(`Error when loading from ${url} to ${path}`);
      logAxios(e);
      // HTTP error
      if (e.response) {
        reject(new Error(`Loading resourse from ${url} ended with status ${e.response.status}`));
      }
      // writeFile error
      reject(new Error(e));
    });
});
