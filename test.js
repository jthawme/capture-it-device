import path from "path";
import { deleteAsync } from "del";
import { initialize } from "./src/main.js";
import { dateBasedFileName, outputFile } from "./src/utils.js";
import { notifyEmail } from "./src/email.js";
import { getSignedFile } from "./src/s3.js";

(async () => {
  try {
    console.log(`Platform: ${process.platform}`);
    const { getWebcam, takePhoto, timelapse, uploadFile } = await initialize();

    const camera = await getWebcam();

    const fileName = outputFile(dateBasedFileName());

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
  } catch (e) {
    console.log("Caught error");

    console.log(e);
  }
})();
