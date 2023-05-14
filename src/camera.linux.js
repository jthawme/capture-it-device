import { libcamera } from "libcamera";
import path from "path";
import {
  dateBasedFileName,
  iteratedDataBasedFileName,
  iteratedPatternFileName,
  outputFile,
  stripExtension,
  tmpFile,
} from "./utils.js";
import ffmpeg from "fluent-ffmpeg";

export const getWebcam = (finder = () => true) => {
  return Promise.resolve("no camera object needed on linux");
};

export const takePhoto = (fileName, { camera } = {}) => {
  return libcamera.jpeg({
    config: {
      output: fileName,
      nopreview: true,
    },
  });
};

export const saveTimelapse = (baseFile, { fps = 10, padNum = 4 }) => {
  return new Promise((resolve, reject) => {
    const output = outputFile(`${stripExtension(baseFile)}.mp4`);

    ffmpeg()
      .input(`tmp/${stripExtension(baseFile)}.%0${padNum}d.jpg`)
      .inputFPS(fps)
      .videoCodec("libx264")
      .videoFilters(`fps=${fps}`)
      .outputOption("-pix_fmt yuv420p")
      .saveToFile(output)
      .on("error", (err) => {
        reject(err);
      })
      .on("end", () => {
        resolve(output);
      });
  });
};

export const timelapse = async ({
  camera,
  seconds = 60,
  fps = 10,
  baseFileName = dateBasedFileName(),
  onProgress = () => false,
  filePrefix = (file) => tmpFile(file),
  width = 1920,
  height = 1080,
} = {}) => {
  const startTime = Date.now();
  const totalTime = seconds * 1000;

  let timer = -1;
  const updater = () => {
    clearTimeout(timer);
    const perc = (Date.now() - startTime) / totalTime;
    onProgress(perc);

    if (perc < 1) {
      timer = setTimeout(() => {
        updater();
      }, 500);
    }
  };

  updater();

  const patternName = filePrefix(
    iteratedPatternFileName(path.basename(baseFileName))
  );

  const outputFile = await libcamera.still({
    config: {
      output: patternName,
      nopreview: true,
      timelapse: 1000 / fps,
      timeout: totalTime,
      width,
      height,
    },
  });

  console.log("out of interest ", outputFile);

  return saveTimelapse(path.basename(baseFileName), { fps });
};
