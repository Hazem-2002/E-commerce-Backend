const paymentSuccessTemplate = ({
  name,
  orderId,
  transactionId,
  paymentMethod,
  amount,
  currency = "EGP",
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Payment Successful</title>
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
          style="padding: 40px 15px;"
        >
          <tr>
            <td align="center">

              <!-- Main Container -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width: 600px;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  border: 1px solid #e5e7eb;
                "
              >

                <!-- Header -->
                <tr>
                  <td
                    style="
                      background-color: #111827;
                      padding: 30px 20px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 26px;
                      "
                    >
                      ${process.env.APP_NAME}
                    </h1>

                    <p
                      style="
                        margin: 10px 0 0;
                        color: #d1d5db;
                        font-size: 14px;
                      "
                    >
                      Payment Confirmation
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 35px 30px;">

                    <!-- Success Icon -->
                    <div
                      style="
                        width: 64px;
                        height: 64px;
                        line-height: 64px;
                        margin: 0 auto 20px;
                        text-align: center;
                        border-radius: 50%;
                        background-color: #dcfce7;
                        color: #15803d;
                        font-size: 36px;
                        font-weight: bold;
                      "
                    >
                      &#10003;
                    </div>

                    <h2
                      style="
                        margin: 0 0 15px;
                        text-align: center;
                        color: #111827;
                        font-size: 24px;
                      "
                    >
                      Payment Successful!
                    </h2>

                    <p
                      style="
                        margin: 0 0 25px;
                        text-align: center;
                        font-size: 15px;
                        line-height: 1.7;
                        color: #4b5563;
                      "
                    >
                      Hello ${name || "there"},
                      <br />
                      Your payment has been received successfully.
                      Thank you for shopping with ${process.env.APP_NAME}!
                    </p>

                    <!-- Payment Amount -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        background-color: #f0fdf4;
                        border: 1px solid #bbf7d0;
                        border-radius: 10px;
                      "
                    >
                      <tr>
                        <td
                          align="center"
                          style="padding: 22px 15px;"
                        >
                          <p
                            style="
                              margin: 0 0 8px;
                              color: #166534;
                              font-size: 14px;
                            "
                          >
                            Amount Paid
                          </p>

                          <h2
                            style="
                              margin: 0;
                              color: #166534;
                              font-size: 30px;
                            "
                          >
                            ${amount} ${currency}
                          </h2>
                        </td>
                      </tr>
                    </table>

                    <!-- Transaction Details -->
                    <h3
                      style="
                        margin: 30px 0 15px;
                        color: #111827;
                        font-size: 17px;
                      "
                    >
                      Payment Details
                    </h3>

                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        border-collapse: collapse;
                        font-size: 14px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding: 12px 0;
                            color: #6b7280;
                            border-bottom: 1px solid #e5e7eb;
                          "
                        >
                          Order ID
                        </td>
                        <td
                          align="right"
                          style="
                            padding: 12px 0;
                            color: #111827;
                            font-weight: bold;
                            border-bottom: 1px solid #e5e7eb;
                            word-break: break-word;
                          "
                        >
                          ${orderId || "N/A"}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 12px 0;
                            color: #6b7280;
                            border-bottom: 1px solid #e5e7eb;
                          "
                        >
                          Transaction ID
                        </td>
                        <td
                          align="right"
                          style="
                            padding: 12px 0;
                            color: #111827;
                            font-weight: bold;
                            border-bottom: 1px solid #e5e7eb;
                            word-break: break-word;
                          "
                        >
                          ${transactionId || "N/A"}
                        </td>
                      </tr>

                      <tr>
                        <td
                          style="
                            padding: 12px 0;
                            color: #6b7280;
                          "
                        >
                          Payment Method
                        </td>
                        <td
                          align="right"
                          style="
                            padding: 12px 0;
                            color: #111827;
                            font-weight: bold;
                          "
                        >
                          ${paymentMethod || "Online Payment"}
                        </td>
                      </tr>
                    </table>

                    <!-- Next Steps -->
                    <div
                      style="
                        margin-top: 30px;
                        padding: 18px;
                        background-color: #f9fafb;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #374151;
                          font-size: 14px;
                          line-height: 1.7;
                        "
                      >
                        <strong>What's next?</strong>
                        <br />
                        We're preparing your order.
                        You'll receive further updates about your order
                        status as it progresses.
                      </p>
                    </div>

                    <p
                      style="
                        margin: 25px 0 0;
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 1.7;
                        text-align: center;
                      "
                    >
                      If you have any questions about your payment,
                      please contact our support team.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td
                    style="
                      padding: 20px;
                      background-color: #f9fafb;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #9ca3af;
                        font-size: 12px;
                        line-height: 1.6;
                      "
                    >
                      &copy; ${new Date().getFullYear()} ${process.env.APP_NAME}.
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

module.exports = paymentSuccessTemplate;
