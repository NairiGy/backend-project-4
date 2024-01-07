const replaceSymbols = (str) => {
  const unwantedSymbol = /[^A-Za-z0-9]/g;
  const newStr = str.replaceAll(unwantedSymbol, '-');

  return newStr;
};
