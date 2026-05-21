const { URLSearchParams } = require('url');

/**
 * Parses the non-standard JS-like object string returned by the IMS portal.
 * Example input: { status : 'fail', message : 'Incorrect password' }
 */
const parseImsResponse = (str) => {
    try {
        // Clean keys and values to valid JSON
        const jsonString = str
            .replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":') // Quote unquoted keys
            .replace(/'([^']*)'/g, '"$1"');          // Replace single quotes with double quotes
        return JSON.parse(jsonString);
    } catch (e) {
        // Fallback regex parsing if JSON conversion fails
        const statusMatch = str.match(/status\s*:\s*['"]([^'"]+)['"]/);
        const messageMatch = str.match(/message\s*:\s*['"]([^'"]+)['"]/);
        return {
            status: statusMatch ? statusMatch[1] : null,
            message: messageMatch ? messageMatch[1] : null
        };
    }
};

/**
 * authenticates the session client using registerNo and password.
 * Throws an Error if credentials are invalid or if session could not be established.
 */
const login = async (client, registerNo, password) => {
    try {
        // 1. Establish session and retrieve initial cookies
        await client.get('/home.jsp');

        // 2. Perform login POST request
        const params = new URLSearchParams();
        params.append('userId', registerNo);
        params.append('password', password);

        const response = await client.post('/studentLogin/studentLogin.action?personType=student', params.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': 'http://mitsims.in/home.jsp'
            }
        });

        const body = response.data;

        // Check if response indicates a failure
        if (typeof body === 'string') {
            if (body.includes("status : 'fail'") || body.includes('incorrect') || body.includes('Password')) {
                const result = parseImsResponse(body);
                throw new Error(result.message || 'The password you have entered is incorrect.');
            }
        }

        // 3. Complete authentication handshake by calling the redirect endpoint
        const redirectResponse = await client.get('/studentLogin/studentReDirect.action?personType=student');
        
        const redirectBody = redirectResponse.data;
        if (typeof redirectBody === 'string' && redirectBody.includes('session has timed out')) {
            throw new Error('Authentication failed: Session timed out or invalid credentials.');
        }

        return client;
    } catch (error) {
        if (error.response && error.response.data && typeof error.response.data === 'string') {
            if (error.response.data.includes('session has timed out')) {
                throw new Error('Session timed out. Please try again.');
            }
        }
        throw new Error(error.message || 'Failed to authenticate with IMS portal.');
    }
};

module.exports = { login, parseImsResponse };
