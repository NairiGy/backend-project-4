import axios from 'axios';
import { writeFile } from 'fs/promises';

export default (url, output) => new Promise((resolve) => {
  const protocol = /^https?:\/\//;
  const unwantedSymbol = /[^A-Za-z0-9]/g;
  const fileName = url
    .replace(protocol, '')
    .replaceAll(unwantedSymbol, '-');
  const path = `${output}/${fileName}.html`;

  axios
    .get(url)
    .then(({ data }) => {
      writeFile(path, data)
        .then(resolve(path));
    });
});
