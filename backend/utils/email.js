const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "sharmasahil00746@gmail.com";

async function notifyAdminsLeaveRequest({ employeeName, type, startDate, endDate, reason }) {
  try {

    const start = new Date(startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const end = new Date(endDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `Leave Request: ${employeeName} - ${type}`,
      html: `
        <h2>New Leave Request</h2>
        <p><strong>${employeeName}</strong> has submitted a leave request.</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Type</td><td style="padding:8px 0;">${type}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">From</td><td style="padding:8px 0;">${start}</td></tr>
          <tr><td style="padding:8px 16px 8px 0;font-weight:bold;">To</td><td style="padding:8px 0;">${end}</td></tr>
          ${reason ? `<tr><td style="padding:8px 16px 8px 0;font-weight:bold;">Reason</td><td style="padding:8px 0;">${reason}</td></tr>` : ""}
        </table>
        <p>Please review this request in the admin panel.</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send leave notification email:", error);
  }
}

async function notifyAllNewUpdate({ title, content, postedBy }) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `New Update: ${title}`,
      html: `
        <h2>${title}</h2>
        ${content ? `<p>${content}</p>` : ""}
        <p style="color:#6b7280;font-size:14px;margin-top:16px;">Posted by ${postedBy}</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send update notification email:", error);
  }
}

module.exports = { notifyAdminsLeaveRequest, notifyAllNewUpdate };
