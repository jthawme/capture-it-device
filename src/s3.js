import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

export const getClient = () => {
  return new S3Client({
    region: process.env.REGION || "us-east-1",
  });
};

export const uploadFile = (
  fileName,
  body,
  { Bucket = process.env.BUCKET_NAME } = {}
) => {
  const parallelUploads3 = new Upload({
    client: getClient(),
    params: {
      Bucket,
      Key: fileName,
      Body: body,
    },
  });

  return parallelUploads3.done().then(() => {
    return `https://${Bucket}.s3.amazonaws.com/${fileName}`;
  });
};

export const getSignedFile = (
  fileName,
  { Bucket = process.env.BUCKET_NAME, expiresIn = 3600 } = {}
) => {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket,
    Key: fileName,
  });
  return getSignedUrl(client, command, { expiresIn });
};
