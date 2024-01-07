#!/usr/bin/env node
import { program } from 'commander';
import pageLoader from '../src/pageLoader.js';

const VERSION = '1.0.0';

program
  .description('Page loader utility')
  .version(VERSION, '-V, --version', 'output the current version')
  .helpOption('-h, --help', 'display help for command')
  .option('-o, --output [dir]', 'output dir (default: "/home/user/current-dir")', process.cwd())
  .argument('<url>')
  .action(async (url, options) => {
    const fileName = await pageLoader(url, options.output);
    console.log(`Page was successfully loaded into '${options.output}/${fileName}'`);
  })
  .parse();
