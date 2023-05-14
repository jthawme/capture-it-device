import path from "path";
import { deleteAsync } from "del";
import { initialize } from "./src/main.js";
import { dateBasedFileName, outputFile } from "./src/utils.js";
import { notifyEmail } from "./src/email.js";
import { getSignedFile } from "./src/s3.js";
import cleanup from "@hypercliq/shutdown-cleanup";
import readline from "readline";

const OPTION = {
  STATIC: 0,
  TIMELAPSE: 1,
};

const getInput = () => {
  const intfc = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    intfc.question(`Enter input (0 / 1): `, (answer) => {
      intfc.close();

      const num = parseInt(answer);

      if (isNaN(num) || ![0, 1].includes(num)) {
        console.log("invalid answer");
        return getInput();
      }

      resolve(num);
    });
  });
};

const run = async () => {
  cleanup.registerHandler(() => console.log("\n\nSee ya"));

  try {
    const { getWebcam, takePhoto, timelapse, uploadFile } = await initialize();

    const input = await getInput();
    const camera = await getWebcam();
    const fileName = outputFile(dateBasedFileName());

    const runCommand = () => {
      if (OPTION.STATIC === input) {
        console.log("Static photo");
        return takePhoto(fileName, { camera });
      }

      if (OPTION.TIMELAPSE === input) {
        return timelapse({
          baseFileName: fileName,
          camera,
          onProgress: (perc) => {
            process.stdout.write(
              `Timelapse Percentage: ${Math.round(perc * 100)}%\r`
            );
          },
        });
      }
    };

    const localFile = await runCommand();
    await uploadFile(localFile);
    const presigned = await getSignedFile(path.basename(localFile));
    await notifyEmail(presigned);

    console.log(`URL: ${presigned}`);

    await deleteAsync([localFile]);

    run();
  } catch (e) {
    console.log("Caught error");

    console.log(e);
  }
};

run();
