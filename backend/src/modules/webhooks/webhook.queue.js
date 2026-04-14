'use strict';
const axios = require('axios');
const logger = require('../../config/logger');

// Simple in-memory queue to prevent massive Axios thread-blocking
const queue = [];
let isProcessing = false;

const MAX_CONCURRENCY = 5;

// The worker loop
async function processQueue() {
    if (isProcessing || queue.length === 0) return;
    isProcessing = true;

    while (queue.length > 0) {
        // Take up to MAX_CONCURRENCY jobs from the queue
        const batch = queue.splice(0, MAX_CONCURRENCY);
        
        const promises = batch.map(async (job) => {
            const { url, payload, headers, orderId } = job;
            try {
                await axios.post(url, payload, { headers, timeout: 5000 });
                logger.info({ orderId, url }, 'Webhook delivered successfully');
            } catch (err) {
                logger.error({ err: err.message, orderId, url }, 'Webhook delivery failed');
                // Optional: For a real robust system, we would put the job back in queue with a retry count
                // and a delayed backoff, but for this prototype, we just log and move on.
            }
        });

        // Wait for current batch to finish before grabbing the next
        await Promise.allSettled(promises);
    }
    
    isProcessing = false;
}

// Public method to add to queue
function dispatchWebhook(url, payloadString, headers, orderId) {
    queue.push({ url, payload: payloadString, headers, orderId });
    
    // Start processing asynchronously without waiting
    processQueue().catch(err => logger.error({ err }, 'Queue processing error'));
}

module.exports = { dispatchWebhook };
