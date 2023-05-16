import path from "path";
import { deleteAsync } from "del";
import { initialize } from "./src/main.js";
import {
  dateBasedFileName,
  outputFile,
  timeout,
  tmpFile,
} from "./src/utils.js";
import { notifyEmail } from "./src/email.js";
import { getSignedFile } from "./src/s3.js";
import cleanup from "@hypercliq/shutdown-cleanup";

let end = () => false;

(async () => {
  try {
    const {
      getWebcam,
      takePhoto,
      timelapse,
      uploadFile,
      displayError,
      listenForInput,
      blink,
      destroy,
    } = await initialize();

    const camera = await getWebcam();

    let busy = false;

    try {
      const onInput = async (input, time) => {
        if (busy) {
          return;
        }

        if (["image", "timelapse"].includes(input)) {
          const runCommand = async () => {
            const fileName = outputFile(dateBasedFileName());

            if (input === "image") {
              console.log("image", time || 1000);
              const blinkUnlisten = blink({
                interval: 500,
              });
              await timeout(time || 1000);
              const file = await takePhoto(fileName, { camera });
              await blinkUnlisten();

              return file;
            }

            if (input === "timelapse") {
              console.log("timelapse", time || 60);
              const blinkUnlisten = blink({
                interval: 500,
              });
              const file = await timelapse({
                baseFileName: fileName,
                camera,
                seconds: time || 60,
              });
              await blinkUnlisten();

              return file;
            }
          };

          const localFile = await runCommand();
          await uploadFile(localFile);
          const presigned = await getSignedFile(path.basename(localFile));
          await notifyEmail(presigned, localFile);

          console.log(`URL: ${presigned}`);

          await deleteAsync([localFile, tmpFile("*.jpg")]);
        }
      };

      listenForInput(onInput);

      console.log(`Initialised with webcam, waiting for input`);

      end = async () => {
        await destroy();
        console.log("\n\nSee ya");
      };

      cleanup.registerHandler(end);
    } catch (e) {
      console.log("Inline error");
      console.log(e);

      displayError(e.message).then((errorUnlisten) => {
        return timeout(2000).then(() => errorUnlisten());
      });

      end();
    }
  } catch (e) {
    console.log("Top error");

    console.log(e);

    end();
  }
})();
