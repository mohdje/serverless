
const paypalBaseApi = "https://api-m.sandbox.paypal.com";
const tokenApiUrl = `${paypalBaseApi}/v1/oauth2/token`;
const ordersUrl = `${paypalBaseApi}/v2/checkout/orders`;

async function generateAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    try {
        if (!clientId || !clientSecret) {
            console.error("Missing credentials")
            return null;
        }
        const auth = Buffer.from(clientId + ":" + clientSecret).toString('base64');
        const response = await fetch(tokenApiUrl, {
            method: "POST",
            body: "grant_type=client_credentials",
            headers: {
                Authorization: `Basic ${auth}`,
            },
        });
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error("error", error)
        return null;
    }
};

async function createOrder(accessToken, currency, value) {
    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: currency,
                    value: value,
                },
            },
        ],
    };

    const response = await fetch(ordersUrl, {
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
        return order.id;
    } catch (err) {
        console.error("PaypalService: createOrder Failed", `Access Token:${accessToken}`, `Currency:${currency}`, `Value:${value}`)
        return null;
    }
}

module.exports = { generateAccessToken, createOrder }