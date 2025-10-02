const sgMail = require("@sendgrid/mail");

const testSendGridConnection = async () => {
  try {
    if (
      !process.env.SENDGRID_API_KEY ||
      process.env.SENDGRID_API_KEY === "your_sendgrid_api_key_here"
    ) {
      console.log("[Email]  SendGrid API key not configured");
      return false;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("[Email]  SendGrid API key configured");
    console.log(`[Email]  Sender email: ${process.env.SENDER_EMAIL}`);
    return true;
  } catch (error) {
    console.error("[Email]  SendGrid connection error:", error.message);
    return false;
  }
};

const sendWelcomeEmail = async (email, name) => {
  try {
    // Only send email if SendGrid API key is configured
    if (
      !process.env.SENDGRID_API_KEY ||
      process.env.SENDGRID_API_KEY === "your_sendgrid_api_key_here"
    ) {
      console.log("[Email] SendGrid not configured. Skipping welcome email.");
      return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: process.env.SENDER_EMAIL || "noreply@taskmanager.com",
      subject: "Chào mừng bạn đến với Task Manager!",
      text: `Xin chào ${name},\n\nCảm ơn bạn đã đăng ký tài khoản Task Manager. Chúng tôi hy vọng ứng dụng sẽ giúp bạn quản lý công việc hiệu quả hơn.\n\nChúc bạn một ngày tốt lành!\n\nTask Manager Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Chào mừng bạn đến với Task Manager!</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản Task Manager. Chúng tôi hy vọng ứng dụng sẽ giúp bạn quản lý công việc hiệu quả hơn.</p>
          <p>Chúc bạn một ngày tốt lành!</p>
          <p style="color: #6b7280; margin-top: 30px;">Task Manager Team</p>
        </div>
      `,
    });

    console.log(`[Email] Welcome email sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send welcome email:", error.message);
    // Don't throw error - we don't want email failure to block user registration
  }
};

const sendCancelationEmail = async (email, name) => {
  try {
    // Only send email if SendGrid API key is configured
    if (
      !process.env.SENDGRID_API_KEY ||
      process.env.SENDGRID_API_KEY === "your_sendgrid_api_key_here"
    ) {
      console.log(
        "[Email] SendGrid not configured. Skipping cancelation email."
      );
      return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log(`[Email] Cancelation email sent to ${email}`);
  } catch (error) {
    console.error("[Email] Failed to send cancelation email:", error.message);
    // Don't throw error - we don't want email failure to block user deletion
  }
};

const sendPasswordResetEmail = async (email, name, resetURL) => {
  try {
    if (
      !process.env.SENDGRID_API_KEY ||
      process.env.SENDGRID_API_KEY === "your_sendgrid_api_key_here"
    ) {
      console.log(
        "[Email] SendGrid not configured. Skipping password reset email."
      );
      console.log(`[Email] Reset URL would be: ${resetURL}`);
      return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: process.env.SENDER_EMAIL || "noreply@taskmanager.com",
      subject: "Đặt lại mật khẩu Task Manager",
      text: `Xin chào ${name},\n\nBạn đã yêu cầu đặt lại mật khẩu cho tài khoản Task Manager của mình.\n\nVui lòng nhấp vào link sau để đặt lại mật khẩu (link có hiệu lực trong 1 giờ):\n${resetURL}\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\nTask Manager Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Task Manager của mình.</p>
          <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu (link có hiệu lực trong 1 giờ):</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Đặt lại mật khẩu</a>
          </div>
          <p style="color: #ef4444; font-size: 14px; margin-top: 20px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          <p style="color: #6b7280; margin-top: 30px;">Task Manager Team</p>
        </div>
      `,
    });

    console.log(`[Email] Password reset email sent to ${email}`);
  } catch (error) {
    console.error(
      "[Email] Failed to send password reset email:",
      error.message
    );
  }
};

const sendTaskReminderEmail = async (
  email,
  name,
  taskDescription,
  dueDate,
  category = "Chung"
) => {
  try {
    console.log(`[Email] Attempting to send task reminder to ${email}`);
    console.log(
      `[Email] Task: "${taskDescription}", Category: ${category}, Due: ${dueDate}`
    );

    if (
      !process.env.SENDGRID_API_KEY ||
      process.env.SENDGRID_API_KEY === "your_sendgrid_api_key_here"
    ) {
      console.log(
        "[Email] SendGrid not configured. Skipping task reminder email."
      );
      return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const formattedDate =
      typeof dueDate === "string"
        ? dueDate
        : new Date(dueDate).toLocaleString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

    if (!email || !email.includes("@")) {
      console.error("[Email] Invalid email address:", email);
      return;
    }

    const msg = {
      to: email,
      from: process.env.SENDER_EMAIL || "noreply@taskmanager.com",
      subject: `⏰ Nhắc nhở: Công việc [${category}] sắp đến hạn!`,
      text: `Xin chào ${name},\n\nCông việc của bạn sắp đến hạn trong 1 giờ nữa:\n\nHạng mục: ${category}\n"${taskDescription}"\n\nThời gian hẹn: ${formattedDate}\n\nĐừng quên hoàn thành công việc này nhé!\n\nTask Manager Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">⏰ Nhắc nhở: Công việc sắp đến hạn!</h2>
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Công việc của bạn sắp đến hạn trong <strong style="color: #ef4444;">1 giờ nữa</strong>:</p>
          <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #92400e;"><strong>📁 Hạng mục:</strong> ${category}</p>
            <p style="margin: 0; font-size: 16px;"><strong>"${taskDescription}"</strong></p>
          </div>
          <p><strong>Thời gian hẹn:</strong> ${formattedDate}</p>
          <p style="color: #6b7280;">Đừng quên hoàn thành công việc này nhé!</p>
          <p style="color: #6b7280; margin-top: 30px;">Task Manager Team</p>
        </div>
      `,
    };

    console.log(
      "[Email] Sending email with config:",
      JSON.stringify({ to: msg.to, from: msg.from, subject: msg.subject })
    );

    const result = await sgMail.send(msg);
    console.log(`[Email] Task reminder email sent successfully to ${email}`);
    console.log(`[Email] SendGrid response:`, result[0].statusCode);
  } catch (error) {
    console.error(
      "[Email] Failed to send task reminder email:",
      error.message
    );
    // Thêm logging chi tiết lỗi từ SendGrid
    if (error.response) {
      console.error("[Email] SendGrid error details:", error.response.body);
    }
  }
};

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
  sendPasswordResetEmail,
  sendTaskReminderEmail,
  testSendGridConnection, // Export test function
};
