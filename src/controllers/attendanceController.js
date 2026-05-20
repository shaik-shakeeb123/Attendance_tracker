const scraperService = require('../services/scraperService');
const analyticsService = require('../services/analyticsService');

const fetchAttendance = async (req, res, next) => {
    try {
        const { registerNo, password } = req.body;
        
        if (!registerNo || !password) {
            return res.status(400).json({ success: false, message: 'Missing credentials' });
        }

        // Demo fallback for previewing the UI
        if (registerNo.toLowerCase() === 'demo') {
            const mockRawData = {
                overall: 78.4,
                subjects: [
                    { name: "DBMS", attended: 32, conducted: 40, percentage: 80 },
                    { name: "Operating Systems", attended: 25, conducted: 40, percentage: 62.5 },
                    { name: "Computer Networks", attended: 38, conducted: 40, percentage: 95 },
                    { name: "Software Engineering", attended: 28, conducted: 40, percentage: 70 }
                ]
            };
            const processedData = analyticsService.calculateAnalytics(mockRawData);
            return res.json({
                success: true,
                data: processedData
            });
        }

        // We fetch and parse the data directly per-request. No credentials stored.
        const rawData = await scraperService.scrapeAttendance(registerNo, password);
        const processedData = analyticsService.calculateAnalytics(rawData);

        res.json({
            success: true,
            data: processedData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { fetchAttendance };
