async function handler(req, res) {
    if (req.method !== "POST")
        sendErrorResponse(res, "Method not allowed");

    const { generateAccessToken, createOrder } = require('../services/paypalService.js');

    const accessToken = await generateAccessToken();

    if (!accessToken)
        sendErrorResponse(res, "Paypal authentication failed");

    const { body } = req;

    if (!body || !body.currency || !body.value)
        sendErrorResponse(res, "Missing currency or value");

    const orderId = await createOrder(accessToken, body.currency, body.value);

    if (orderId)
        res.status(200).send({ orderId: orderId });
    else
        sendErrorResponse(res, "Order creation failed");
};

function sendErrorResponse(res, message) {
    res.status(500).send({
        error: message
    });
}

const allowCorsMiddleware = require('../middlewares/allowCorsMiddleware.js')
module.exports = allowCorsMiddleware(handler)

