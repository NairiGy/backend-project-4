/* eslint-disable max-len */
import * as cheerio from 'cheerio';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import _ from 'lodash';
import loadResourse from './loadResourse.js';

const logPageLoader = debug('page-loader');

/**
 * @function replaceSymbols
 * Replaces all non-numeric and non-literal symbols with '-'
 * @param {string} str - string to modify
 * @returns {string} modified string
 * @example
 * const str = "ru.hexlet.io/courses/assets/professions";
 *
 * const result = replaceSymbols(str);
 * console.log(result); // ru-hexlet-io-assets-professions
 */
const replaceSymbols = (str) => {
  const unwantedSymbol = /[^A-Za-z0-9]/g;
  const newStr = str.replaceAll(unwantedSymbol, '-');

  return newStr;
};

/**
 * @function createFilesDirName
 * Returns directory name constructed from URL host and pathname
 * @param {Object} url - URL object
 * @returns {string} directory name
 * @example
 * const url = new URL('https://dummyjson.com/docs');
 * const dirName = createFilesDirName(url);
 *
 * console.log(dirName); // dummyjson-com-docs_files
 */
const createFilesDirName = ({ host, pathname }) => `${replaceSymbols(host + pathname)}_files`;

/**
 * @function createFileName
 * Returns file name constructed from URL host, pathname
 * @param {Object} srcUrl - source URL object
 * @returns {string} - source file name
 * @example
 * const url = new URL('https://dummyjson.com/docs');
 * const fileName = createFileName(url);
 *
 * console.log(fileName); // dummyjson-com-docs.html
 */
const createFileName = (srcUrl) => {
  let ext = path.extname(srcUrl.pathname);
  let fileName;
  if (ext === '') {
    ext = '.html';
    fileName = srcUrl.pathname;
  } else {
    fileName = srcUrl.pathname.substring(0, srcUrl.pathname.lastIndexOf('.'));
  }
  return `${replaceSymbols(srcUrl.host + fileName)}${ext}`;
};

const srcAttrubuteName = {
  img: 'src',
  link: 'href',
  script: 'src',
};

const srcResponseType = {
  img: 'arraybuffer',
  link: 'json',
  script: 'json',
};
/**
 * @function
 * 1) Loads a html page from given url
 * 2) Loads all resourses from img, link, script tags, that have the same host as the page
 * 3) Modifies respective src attributes so thay refer to loaded resources
 * @param {string} url - url string of a page
 * @param {string} output - directory to load
 * @returns {string} loaded page file name
 */
export default (url, output) => new Promise((resolve, reject) => {
  const tasks = [];
  logPageLoader(`Starting loading page from ${url} to ${output}`);
  const pageUrl = new URL(url);
  const pageFileName = createFileName(pageUrl); // ru-hexlet-io-courses.html
  const filesDirName = createFilesDirName(pageUrl); // ru-hexlet-io-courses_files
  let $;
  mkdir(path.join(output, filesDirName))
    .then(() => loadResourse(url, path.join(output, pageFileName)))
    .then((content) => {
      $ = cheerio.load(content);
      $('img, link, script').each((_, el) => {
        const { tagName } = $(el).get(0);
        const srcAttr = srcAttrubuteName[tagName];
        const oldSrc = $(el).attr(srcAttr);
        // If there is no source attribute in a tag
        if (!oldSrc) {
          return null;
        }

        const srcUrl = new URL(oldSrc, pageUrl.origin);
        // If hosts are different
        if (pageUrl.host !== srcUrl.host) {
          return null;
        }

        const srcFileName = createFileName(srcUrl);
        const newSrc = `${filesDirName}/${srcFileName}`;

        $(el).attr(srcAttr, newSrc);
        logPageLoader(`Adding task of loading ${srcUrl.href} to ${path.join(output, filesDirName, srcFileName)}`);
        const task = {
          title: srcUrl.href,
          task: () => loadResourse(srcUrl.href, path.join(output, filesDirName, srcFileName), srcResponseType[tagName]),
        };

        return tasks.push(task);
      });
    }).then(() => {
      const noDuplicateTasks = _.uniqBy(tasks, 'title');
      const list = new Listr(noDuplicateTasks, { concurrent: true });
      return list.run();
    })
    .then(() => writeFile(path.join(output, pageFileName), $.html()))
    .then(() => resolve(pageFileName))
    .catch((e) => {
      if (e.errno === -17) {
        console.log(`Directory ${output}/${filesDirName} already exists`);
      } else if (e) {
        console.log(`${e}`);
      } else {
        console.log('Unexpected error');
      }
      process.exitCode = 1;
    });
});
