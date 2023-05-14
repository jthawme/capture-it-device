import fs from "fs-extra";
import path from "path";
import * as url from "url";

export const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export const dirFile = (dir, file = "") => path.join(__dirname, dir, file);
export const tmpFile = (file = "") => dirFile("../tmp", file);
export const outputFile = (file = "") => dirFile("../output", file);

export const dateBasedFileName = ({ extension = "jpg" } = {}) => {
  return [Date.now(), extension].join(".");
};

export const iteratedDataBasedFileName = (
  index = 0,
  fileName,
  { padNum = 4 } = {}
) => {
  const ext = path.extname(fileName);

  const pre = fileName.split(ext).shift();
  const iterate = index.toString().padStart(padNum, "0");

  return `${pre}.${iterate}${ext}`;
};

export const iteratedPatternFileName = (fileName, { padNum = 4 } = {}) => {
  const ext = path.extname(fileName);

  const pre = fileName.split(ext).shift();

  return `${pre}.%0${padNum}d${ext}`;
};

export const stripExtension = (fileName) => {
  return fileName.split(path.extname(fileName)).join("");
};

export const timeout = (time = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};
