import NodeWebcam from "node-webcam";
import {
  dateBasedFileName,
  iteratedDataBasedFileName,
  outputFile,
  stripExtension,
  tmpFile,
} from "./utils.js";
import ffmpeg from "fluent-ffmpeg";

export const getWebcam = (finder = () => true) => {
  return new Promise((resolve, reject) => {
    NodeWebcam.list((list) => {
      if (list.length === 0) {
        reject("No Cameras");
        return;
      }
      resolve(
        NodeWebcam.create({ device: list.find(finder).split("=> ").join("") })
      );
    });
  });
};

export const takePhoto = (fileName, { camera } = {}) => {
  return new Promise((resolve, reject) => {
    camera.capture(fileName, function (err, data) {
      if (err) {
        reject(err);
        return;
      }

      resolve(data);
    });
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

export const timelapse = ({
  camera,
  seconds = 60,
  fps = 10,
  frameTimeMin = 500,
  onProgress = () => false,
  filePrefix = (file) => tmpFile(file),
} = {}) => {
  const startTime = Date.now();
  const endTime = startTime + seconds * 1000;
  const totalFrames = Math.ceil((seconds * 1000) / frameTimeMin);

  const files = [];

  const baseFileName = dateBasedFileName();

  return new Promise((resolve, reject) => {
    const run = async (idx = 0) => {
      if (startTime + seconds * 1000 <= Date.now()) {
        resolve(files);
        return;
      }

      onProgress((Date.now() - startTime) / (endTime - startTime));

      try {
        const timeBefore = Date.now();
        const file = await takePhoto(
          filePrefix(iteratedDataBasedFileName(idx, baseFileName)),
          { camera }
        );
        const deltaTime = Date.now() - timeBefore;
        files.push(file);

        setTimeout(() => {
          run(idx + 1);
        }, Math.max(0, frameTimeMin - deltaTime));
      } catch (e) {
        reject(e);
      }
    };

    run();
  }).then((files) => {
    return saveTimelapse(baseFileName, { fps });
  });
};
