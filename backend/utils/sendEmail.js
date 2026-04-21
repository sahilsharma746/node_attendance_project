const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.FROM_EMAIL || "onboarding@resend.dev";

async function sendEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: `Cloveode Attendance <${FROM}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Email send error:", err);
  }
}

function leaveRequestEmail({ employeeName, type, startDate, endDate, reason, isHalfDay, halfDaySession }) {
  const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const halfDayInfo = isHalfDay ? ` (${halfDaySession === "first_half" ? "First Half" : "Second Half"})` : "";
  return {
    subject: `New Leave Request from ${employeeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #4f46e5;">New Leave Request</h2>
        <p><strong>${employeeName}</strong> has requested leave.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280;">Type</td><td style="padding: 8px; font-weight: 600;">${type}${halfDayInfo}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Date</td><td style="padding: 8px; font-weight: 600;">${dateRange}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Reason</td><td style="padding: 8px;">${reason || "N/A"}</td></tr>
        </table>
        <p style="color: #6b7280; font-size: 13px;">Please log in to the dashboard to approve or reject this request.</p>
      </div>
    `,
  };
}

function leaveStatusEmail({ employeeName, type, startDate, endDate, status, adminNote, isHalfDay, halfDaySession }) {
  const dateRange = startDate === endDate ? startDate : `${startDate} to ${endDate}`;
  const halfDayInfo = isHalfDay ? ` (${halfDaySession === "first_half" ? "First Half" : "Second Half"})` : "";
  const color = status === "approved" ? "#22c55e" : "#ef4444";
  const statusText = status === "approved" ? "Approved" : "Rejected";
  return {
    subject: `Leave ${statusText} — ${dateRange}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: ${color};">Leave ${statusText}</h2>
        <p>Hi <strong>${employeeName}</strong>,</p>
        <p>Your leave request has been <strong style="color: ${color};">${statusText.toLowerCase()}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #6b7280;">Type</td><td style="padding: 8px; font-weight: 600;">${type}${halfDayInfo}</td></tr>
          <tr><td style="padding: 8px; color: #6b7280;">Date</td><td style="padding: 8px; font-weight: 600;">${dateRange}</td></tr>
          ${adminNote ? `<tr><td style="padding: 8px; color: #6b7280;">Admin Note</td><td style="padding: 8px;">${adminNote}</td></tr>` : ""}
        </table>
      </div>
    `,
  };
}

module.exports = { sendEmail, leaveRequestEmail, leaveStatusEmail };
