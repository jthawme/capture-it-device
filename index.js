import { initialize } from "./src/main.js";

import fetch from "node-fetch";
import { Command, InvalidArgumentError } from "commander";
import path from "path";
import { deleteAsync } from "del";
import { COMMAND, constructMessage } from "@shtudio/hardware";
import {
  log,
  logError,
  logWarning,
  setEndpoint,
  setFetch,
  setOrigin,
} from "@shtudio/logger";

import {
  clamp,
  dateBasedFileName,
  outputFile,
  timeout,
  tmpFile,
} from "./src/utils.js";
import { notifyEmail } from "./src/email.js";
import { getSignedFile } from "./src/s3.js";

setFetch(fetch);
setEndpoint("http://shtudio.local:7065");
setOrigin("capture-it");

const program = new Command();

function intParse(value) {
  const parsedValue = parseInt(value);

  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError("Not a number.");
  }

  return parsedValue;
}
function floatParse(value) {
  const parsedValue = parseFloat(value);

  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError("Not a number.");
  }

  return parsedValue;
}

const blink = (time = 500) => {
  console.log(constructMessage(COMMAND.BLINK, "yellow", time));
};

const blinkOff = () => console.log(constructMessage(COMMAND.TURN_OFF));

const common = async () => {
  const {
    getWebcam,
    takePhoto: photo,
    timelapse,
    uploadFile,
  } = await initialize();

  const camera = await getWebcam();
  const fileName = outputFile(dateBasedFileName());

  return { getWebcam, photo, timelapse, uploadFile, camera, fileName };
};

const takePhoto = async (delay = 1000) => {
  log("Taking photo", {
    delay,
  });

  try {
    const { fileName, photo, uploadFile, camera } = await common();

    blink();
    await timeout(delay);
    const file = await photo(fileName, { camera });
    blinkOff();

    blink(200);
    await uploadFile(fileName);
    const presigned = await getSignedFile(path.basename(fileName));
    await notifyEmail(presigned, fileName);
    blinkOff();

    log(`URL: ${presigned}`);

    console.log(constructMessage(COMMAND.TURN_ON_FOR, "green", 1000));
    await deleteAsync([fileName, tmpFile("*.jpg")]);
  } catch (e) {
    console.error(e);
    await logError(e.message, {
      stack: e.stack,
    });
  }
};

const takeTimelapse = async (time = 60) => {
  log("Taking timelapse", {
    time,
  });

  try {
    const { fileName, timelapse, uploadFile, camera } = await common();

    blink();
    await timeout(1000);
    const file = await timelapse({
      baseFileName: fileName,
      camera,
      seconds: Math.floor(time || 60),
    });
    blinkOff();

    blink(200);
    await uploadFile(file);
    const presigned = await getSignedFile(path.basename(file));
    await notifyEmail(presigned, file);
    blinkOff();

    log(`URL: ${presigned}`);

    console.log(constructMessage(COMMAND.TURN_ON_FOR, "green", 1000));
    await deleteAsync([file, tmpFile("*.jpg")]);
  } catch (e) {
    console.error(e);
    await logError(e.message, {
      stack: e.stack,
    });
  }
};

/** =========== PROGRAM ============ */

program
  .name("capture-it")
  .description("A small hardware tool to snap photos and videos")
  .version("1.0.0");

program
  .command("photo")
  .description("Take a photo")
  .option(
    "-d, --delay <delay>",
    "The delay before taking the photo",
    intParse,
    1000
  )
  .action((options) => {
    takePhoto(options.delay);
  });

program
  .command("timelapse")
  .description("Take a timelapse")
  .option("-t, --time <delay>", "The total time to capture", floatParse, 60)
  .action((options) => {
    takeTimelapse(Math.round(clamp(options.time, 10, 60)));
  });

program.parse();
