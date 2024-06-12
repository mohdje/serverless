const paypalBaseApi = "https://api-m.sandbox.paypal.com";

export default async (req, res) => {

    if (req.method !== 'POST')
        sendErrorResponse(res, "Method not allowed");

    const accessToken = await generateAccessToken();

    if (!accessToken)
        sendErrorResponse(res, "Payment authentication failed");

    const { body } = req;
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: body.currency,
                    value: body.value,
                },
            },
        ],
    };
    const url = `${paypalBaseApi}/v2/checkout/orders`;

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
            // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
            // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
            // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
        },
        method: "POST",
        body: JSON.stringify(payload),
    });


    try {
        const order = await response.json();
        res.status(200).send({ orderId: order.id });
    } catch (err) {
        sendErrorResponse(res, "Order creation failed");
    }
};

function sendErrorResponse(res, message) {
    res.status(500).send({
        error: message
    });
}

async function generateAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    try {
        if (!clientId || !clientSecret) {
            return null;
        }
        const auth = btoa(clientId + ":" + clientSecret);
        const response = await fetch(`${base}/v1/oauth2/token`, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        return null;
    }
};
