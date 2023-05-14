import path from "path";
import { deleteAsync } from "del";
import { initialize } from "./src/main.js";
import { dateBasedFileName, outputFile, timeout } from "./src/utils.js";
import { notifyEmail } from "./src/email.js";
import { getSignedFile } from "./src/s3.js";
import cleanup from "@hypercliq/shutdown-cleanup";
import { blink } from "./src/interact.linux.js";

let end = () => false;

(async () => {
  try {
    console.log(`Platform: ${process.platform}`);

    const onInput = (input) => {
      if (input === "image") {
        console.log("bit messy, image");
      }

      if (input === "timelapse") {
        console.log("bit messy, timelapse");
      }
    };

    const {
      getWebcam,
      takePhoto,
      timelapse,
      uploadFile,
      displayError,
      listenForInput,
      destroy,
    } = await initialize();

    end = () => {
      destroy();
      console.log("\n\nSee ya");
    };

    cleanup.registerHandler(end);

    const camera = await getWebcam();

    const fileName = outputFile(dateBasedFileName());

    console.log("Testing error state");
    const errorUnlisten = await displayError(`Displaying error`);
    await timeout(2000);
    await errorUnlisten();

    const blinkUnlisten = await blink();
    await timeout(2000);
    await blinkUnlisten();

    // listenForInput(onInput);

    console.log(`Running test photo`);
    const staticPhoto = await takePhoto(fileName, { camera });
    console.log(`Captured test photo: ${staticPhoto}`);

    const seconds = 10;
    console.log(`Running test timelapse, for ${seconds} second`);
    const timelapseVideo = await timelapse({
      camera,
      seconds,
      onProgress: (perc) => {
        process.stdout.write(
          `Timelapse Percentage: ${Math.round(perc * 100)}%\r`
        );
      },
    });
    console.log(`Captured test timelapse: ${timelapseVideo}`);

    console.log(`Uploading test timelapse`);
    const bucketURL = await uploadFile(timelapseVideo);
    console.log(`Finished uploading`);

    console.log(`Sending email`);
    const presigned = await getSignedFile(path.basename(timelapseVideo));
    const resp = await notifyEmail(presigned);
    console.log(`email sent`);
    console.log(`URL: ${presigned}`);

    deleteAsync([timelapseVideo, staticPhoto]);

    // setTimeout(async () => {
    await destroy();
    // }, 2500);
  } catch (e) {
    console.log("Caught error");

    console.log(e);

    end();
  }
})();
