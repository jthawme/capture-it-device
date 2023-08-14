import sgMail from "@sendgrid/mail";
import fs from "fs-extra";
import path from "path";
import mime from "mime";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const notifyEmail = (
  url,
  file,
  { to = process.env.TO_EMAIL, from = process.env.FROM_EMAIL } = {}
) => {
  const fileAttachment = fs.readFileSync(file).toString("base64");

  const msg = {
    to,
    from, // Use the email address or domain you verified above
    subject: `Capture it media ${Date.now()}`,
    // text: 'and easy to do anywhere, even with Node.js',
    html: `<a href="${url}">Find media here</a>`,
    attachments: [
      {
        content: fileAttachment,
        filename: path.basename(file),
        type: mime.getType(file),
        disposition: "attachment",
      },
    ],
  };

  return sgMail.send(msg);
};
