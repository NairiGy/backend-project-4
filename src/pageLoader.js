import * as cheerio from 'cheerio';
import fsp from 'fs/promises';
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

/**
 * @function pageLoader
 * 1) Loads a html page from given url
 * 2) Loads all resourses from img, link, script tags, that have the same host as the page
 * 3) Modifies the corresponding src attributes so they refer to the loaded resources.
 * @param {string} url - url string of a page
 * @param {string} output - directory to load
 * @returns {Promise<string>} - fulfills to the path to created file
 */
export default (url, output) => {
  logPageLoader(`Starting loading page from ${url} to ${output}`);
  const tasks = [];
  const pageUrl = new URL(url);
  const pageFileName = createFileName(pageUrl); // ru-hexlet-io-courses.html
  const filesDirName = createFilesDirName(pageUrl); // ru-hexlet-io-courses_files
  const filesDirFullPath = path.join(output, filesDirName);
  const pageFileFullPath = path.join(output, pageFileName);
  let $;

  return loadResourse(url, pageFileFullPath)
    .then(() => {
      logPageLoader(`Creating directory for files - ${filesDirFullPath}`);
      return fsp.mkdir(filesDirFullPath);
    })
    .then(() => fsp.readFile(pageFileFullPath, 'utf-8'))
    .then((data) => {
      $ = cheerio.load(data);
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
        const srcFileFullPath = path.join(output, filesDirName, srcFileName);
        const newSrc = `${filesDirName}/${srcFileName}`;
        $(el).attr(srcAttr, newSrc);
        logPageLoader(`Adding task of loading ${srcUrl.href} to ${path.join(output, filesDirName, srcFileName)}`);
        const task = {
          title: srcUrl.href,
          task: () => loadResourse(srcUrl.href, srcFileFullPath),
        };
        return tasks.push(task);
      });
    })
    .then(() => {
      const noDuplicateTasks = _.uniqBy(tasks, 'title');
      const list = new Listr(noDuplicateTasks, { concurrent: true });
      logPageLoader(`Running ${noDuplicateTasks.length} tasks`);
      return list.run();
    })
    .then(() => {
      logPageLoader('Changing src values');
      return fsp.writeFile(pageFileFullPath, $.html());
    })
    .then(() => pageFileFullPath);
};
