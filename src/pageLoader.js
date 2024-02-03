import * as cheerio from 'cheerio';
import fsp from 'fs/promises';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import _ from 'lodash';
import loadResourse from './loadResourse.js';

const log = debug('page-loader');

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
  const extension = path.extname(srcUrl.pathname) || '.html';
  const fileName = extension === '.html' ? srcUrl.pathname : srcUrl.pathname.slice(0, -extension.length);
  return replaceSymbols(srcUrl.host + fileName) + extension;
};

const srcAttrubuteName = {
  img: 'src',
  link: 'href',
  script: 'src',
};

/**
 * Prepares assets for a given page URL and HTML content.
 *
 * @param {string} pageUrl - The URL of the page
 * @param {string} filesDirName - The directory name for files
 * @param {string} html - The HTML content of the page
 * @return {Object} An object containing the modified HTML and a list of assets
 */
const prepareAssets = (pageUrl, filesDirName, html) => {
  const $ = cheerio.load(html, { decodeEntities: false });
  const assets = [];
  const entries = Object.entries(srcAttrubuteName);
  entries.forEach(([tagName, attrubuteName]) => {
    $(tagName).each((_i, el) => {
      const oldSrc = $(el).attr(attrubuteName);
      if (!oldSrc) {
        return null;
      }
      const srcUrl = new URL(oldSrc, pageUrl.origin);
      if (pageUrl.host !== srcUrl.host) {
        return null;
      }
      const srcFileName = createFileName(srcUrl);
      const newSrc = `${filesDirName}/${srcFileName}`;
      $(el).attr(attrubuteName, newSrc);
      return assets.push({ url: srcUrl.href, fileName: srcFileName });
    });
  });
  return { html: $.html(), assets };
};

/**
 * @function pageLoader
 * 1) Loads a html page from given url
 * 2) Loads all resourses from img, link, script tags, that have the same host as the page
 * 3) Modifies the corresponding src attributes so they refer to the loaded resources.
 * @param {string} url - url string of a page
 * @param {string} output - directory to load
 * @returns {Promise<string>} fulfills to the path to created file
 */
export default (url, output = process.cwd()) => {
  log(`Starting loading page from ${url} to ${output}`);
  const tasks = [];
  const pageUrl = new URL(url);
  const pageFileName = createFileName(pageUrl);
  const filesDirName = createFilesDirName(pageUrl);
  const filesDirFullPath = path.join(output, filesDirName);
  const pageFileFullPath = path.join(output, pageFileName);

  return loadResourse(url, pageFileFullPath)
    .then(() => {
      log(`Creating directory for files - ${filesDirFullPath}`);
      return fsp.mkdir(filesDirFullPath);
    })
    .then(() => fsp.readFile(pageFileFullPath, 'utf-8'))
    .then((data) => {
      const { html, assets } = prepareAssets(pageUrl, filesDirName, data);
      assets.forEach((asset) => {
        const srcFileFullPath = path.join(output, filesDirName, asset.fileName);
        log(`Adding task of loading ${asset.url} to ${path.join(output, filesDirName, asset.fileName)}`);
        const task = {
          title: asset.url,
          task: () => loadResourse(asset.url, srcFileFullPath),
        };
        return tasks.push(task);
      });
      return html;
    })
    .then((html) => {
      log('Changing src values');
      return fsp.writeFile(pageFileFullPath, html);
    })
    .then(() => {
      const noDuplicateTasks = _.uniqBy(tasks, 'title');
      const list = new Listr(noDuplicateTasks, { concurrent: true });
      log(`Running ${noDuplicateTasks.length} tasks`);
      return list.run();
    })
    .then(() => pageFileFullPath);
};
