const resetPasswordTemplate = ({ name, otp }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Reset Your Password</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        "
      >

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="padding: 40px 20px;"
        >
          <tr>
            <td align="center">

              <!-- Container -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width: 600px;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
                "
              >

                <!-- Header -->
                <tr>
                  <td
                    style="
                      background-color: #111827;
                      padding: 28px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 24px;
                      "
                    >
                      Reset Your Password
                    </h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 35px;">

                    <p
                      style="
                        margin: 0 0 15px;
                        font-size: 16px;
                      "
                    >
                      Hello ${name || "there"},
                    </p>

                    <p
                      style="
                        margin: 0 0 25px;
                        font-size: 15px;
                        line-height: 1.6;
                        color: #4b5563;
                      "
                    >
                      We received a request to reset the password
                      for your account. Please use the verification
                      code below to continue resetting your password.
                    </p>

                    <!-- OTP -->
                    <div
                      style="
                        text-align: center;
                        margin: 30px 0;
                      "
                    >
                      <div
                        style="
                          display: inline-block;
                          padding: 15px 30px;
                          background-color: #f3f4f6;
                          border: 1px solid #e5e7eb;
                          border-radius: 8px;
                          letter-spacing: 8px;
                          font-size: 30px;
                          font-weight: bold;
                          color: #111827;
                        "
                      >
                        ${otp}
                      </div>
                    </div>

                    <p
                      style="
                        margin: 0 0 15px;
                        text-align: center;
                        font-size: 14px;
                        color: #6b7280;
                      "
                    >
                      This verification code will expire in
                      <strong>10 minutes</strong>.
                    </p>

                    <!-- Security Notice -->
                    <div
                      style="
                        margin: 25px 0 0;
                        padding: 15px;
                        background-color: #fff7ed;
                        border: 1px solid #fed7aa;
                        border-radius: 8px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          font-size: 14px;
                          line-height: 1.6;
                          color: #9a3412;
                        "
                      >
                        <strong>Security notice:</strong>
                        Never share this verification code with anyone.
                        We will never ask you to provide this code.
                      </p>
                    </div>

                    <p
                      style="
                        margin: 25px 0 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #6b7280;
                      "
                    >
                      If you did not request a password reset,
                      you can safely ignore this email. Your password
                      will remain unchanged.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    style="
                      padding: 20px 35px;
                      background-color: #f9fafb;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 12px;
                        color: #9ca3af;
                      "
                    >
                      © ${new Date().getFullYear()} Your App.
                      All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>

            </td>
          </tr>
        </table>

      </body>
    </html>
  `;
};

module.exports = resetPasswordTemplate;
