import "./boostrap.js";
import { ensureDir } from "fs-extra";
import { tmpFile, outputFile } from "./utils.js";
import { deleteAsync } from "del";
import { uploadFile } from "./s3.js";
import path from "path";
import fs from "fs-extra";

const getCameraModule = () => {
  return import(`./camera.${process.platform}.js`);
};

const getInteractModule = () => {
  return import(`./interact.${process.platform}.js`);
};

export const initialize = async () => {
  await deleteAsync(tmpFile());
  await ensureDir(tmpFile());
  await ensureDir(outputFile());

  const camera = await getCameraModule();
  const interact = await getInteractModule();

  await interact.initialize();

  return {
    ...camera,
    ...interact,
    uploadFile: (fileName) => {
      return uploadFile(path.basename(fileName), fs.readFileSync(fileName));
    },
    destroy: async () => {
      await interact.destroy();
    },
  };
};
