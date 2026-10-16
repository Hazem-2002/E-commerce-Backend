const cashOnDeliveryTemplate = ({
  name,
  orderId,
  totalAmount,
  currency = "EGP",
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>Order Confirmed</title>
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
                      Order Confirmation
                    </p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 35px 30px;">

                    <!-- Confirmation Icon -->
                    <div
                      style="
                        width: 64px;
                        height: 64px;
                        line-height: 64px;
                        margin: 0 auto 20px;
                        text-align: center;
                        border-radius: 50%;
                        background-color: #dbeafe;
                        color: #1d4ed8;
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
                      Order Confirmed!
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
                      Your order has been placed successfully.
                      Thank you for shopping with ${process.env.APP_NAME}!
                    </p>

                    <!-- Order Amount -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        background-color: #eff6ff;
                        border: 1px solid #bfdbfe;
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
                              color: #1e40af;
                              font-size: 14px;
                            "
                          >
                            Total Amount to Pay
                          </p>

                          <h2
                            style="
                              margin: 0;
                              color: #1e40af;
                              font-size: 30px;
                            "
                          >
                            ${totalAmount} ${currency}
                          </h2>
                        </td>
                      </tr>
                    </table>

                    <!-- Order Details -->
                    <h3
                      style="
                        margin: 30px 0 15px;
                        color: #111827;
                        font-size: 17px;
                      "
                    >
                      Order Details
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
                          Cash on Delivery
                        </td>
                      </tr>
                    </table>

                    <!-- Payment Notice -->
                    <div
                      style="
                        margin-top: 30px;
                        padding: 18px;
                        background-color: #fff7ed;
                        border: 1px solid #fed7aa;
                        border-radius: 8px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #9a3412;
                          font-size: 14px;
                          line-height: 1.7;
                        "
                      >
                        <strong>Payment Reminder</strong>
                        <br />
                        No payment has been collected yet.
                        Please pay the total amount to the delivery
                        agent when your order arrives.
                      </p>
                    </div>

                    <!-- Next Steps -->
                    <p
                      style="
                        margin: 25px 0 0;
                        color: #6b7280;
                        font-size: 13px;
                        line-height: 1.7;
                        text-align: center;
                      "
                    >
                      We're preparing your order.
                      You'll receive further updates as your order
                      progresses.
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

module.exports = cashOnDeliveryTemplate;
