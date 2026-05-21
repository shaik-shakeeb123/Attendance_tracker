const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

/**
 * Creates a session-aware Axios client for MITS IMS.
 * Each invocation returns a client with its own isolated CookieJar.
 */
const createImsClient = () => {
    const jar = new CookieJar();
    const client = wrapper(axios.create({
        baseURL: 'http://mitsims.in',
        jar,
        withCredentials: true,
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        },
        timeout: 25000 // 25 seconds timeout to avoid slow portal issues
    }));

    return client;
};

module.exports = { createImsClient };
