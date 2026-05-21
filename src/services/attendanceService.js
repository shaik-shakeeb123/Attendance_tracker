const { createImsClient } = require('./imsClient');
const { login } = require('./authService');
const { parseAttendance } = require('./parserService');

/**
 * High-level service orchestrator to fetch and parse attendance data using HTTP requests.
 * Completely replaces the legacy browser-based scraper.
 */
const scrapeAttendance = async (registerNo, password) => {
    // 1. Create isolated session client
    const client = createImsClient();

    // 2. Authenticate the student session
    await login(client, registerNo, password);

    // 3. Request the student dashboard page directly
    const response = await client.get('/gemsonline-student/dashboard.action?actionType=view');
    const html = response.data;

    // Validate that the returned content is indeed the dashboard and not a timeout message
    if (typeof html === 'string') {
        if (html.includes('session has timed out') || html.includes('logout.action')) {
            throw new Error('Session expired or invalidated during dashboard retrieval.');
        }
    } else {
        throw new Error('Received unexpected non-string dashboard response.');
    }

    // 4. Parse and structure the dashboard attendance table
    const data = parseAttendance(html);

    if (data.subjects.length === 0) {
        require('fs').writeFileSync('debug_dashboard.html', html);
        throw new Error('Could not parse any subjects from the attendance dashboard. Diagnostic HTML saved to debug_dashboard.html.');
    }

    return data;
};

module.exports = { scrapeAttendance };
