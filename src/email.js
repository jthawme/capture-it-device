import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const notifyEmail = (
  url,
  { to = process.env.TO_EMAIL, from = process.env.FROM_EMAIL } = {}
) => {
  const msg = {
    to,
    from, // Use the email address or domain you verified above
    subject: `Capture it media ${Date.now()}`,
    // text: 'and easy to do anywhere, even with Node.js',
    html: `<a href="${url}">Find media here</a>`,
  };

  return sgMail.send(msg);
};
