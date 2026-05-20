const { chromium } = require('playwright');

const scrapeAttendance = async (registerNo, password) => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('http://mitsims.in/home.jsp#');

        // Toggle to student tab using correct selector
        await page.click('a#studentLink');

        // Wait for inputs to be visible
        await page.locator('#studentForm #inputStuId').fill(registerNo);
        await page.locator('#studentForm #inputPassword').fill(password);
        
        // Click login button
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {}),
            page.locator('#studentForm #studentSubmitButton').click()
        ]);

        // Check if login failed by looking for common error elements or checking the URL
        const currentUrl = page.url();
        if (currentUrl.includes('login') || currentUrl.includes('home.jsp')) {
            const errorMsg = await page.evaluate(() => {
                const err = document.querySelector('.error, .alert-danger, [color="red"]');
                return err ? err.innerText : 'Invalid credentials or portal down';
            });
            throw new Error(errorMsg);
        }

        // Wait for the attendance elements to be populated on the dashboard
        await page.waitForSelector('#semesterActivity fieldset.bottom-border', { timeout: 15000 }).catch(async (err) => {
            const html = await page.content();
            require('fs').writeFileSync('debug_dashboard_error.html', html);
            throw new Error(`Timeout waiting for attendance data. Saved DOM to debug_dashboard_error.html. Error: ${err.message}`);
        });

        // Extract attendance data from the ExtJS fieldsets
        const data = await page.evaluate(() => {
            const subjects = [];
            const rows = document.querySelectorAll('#semesterActivity fieldset.bottom-border');
            
            rows.forEach(row => {
                const cols = row.querySelectorAll('.x-field');
                if (cols.length >= 5) {
                    const sNoText = cols[0].innerText.trim();
                    const name = cols[1].innerText.trim();
                    const attendedText = cols[2].innerText.trim();
                    const conductedText = cols[3].innerText.trim();
                    const percentageText = cols[4].innerText.trim();
                    
                    const sNo = parseInt(sNoText, 10);
                    const attended = parseInt(attendedText, 10) || 0;
                    const conducted = parseInt(conductedText, 10) || 0;
                    const percentage = parseFloat(percentageText) || 0;
                    
                    if (name && name !== 'SUBJECT CODE' && conducted > 0) {
                        // Filter out S.No 3 to S.No 13 as per user request
                        if (!isNaN(sNo) && sNo >= 3 && sNo <= 13) {
                            return;
                        }
                        subjects.push({
                            name,
                            conducted,
                            attended,
                            percentage
                        });
                    }
                }
            });

            // Calculate true overall from extracted subjects
            const totalConducted = subjects.reduce((sum, sub) => sum + sub.conducted, 0);
            const totalAttended = subjects.reduce((sum, sub) => sum + sub.attended, 0);
            const overall = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

            return { overall: parseFloat(overall.toFixed(2)), subjects };
        });

        if (data.subjects.length === 0) {
            const html = await page.content();
            require('fs').writeFileSync('debug_attendance.html', html);
            throw new Error("Could not parse the live attendance table. Page HTML dumped to debug_attendance.html.");
        }

        return data;
    } catch (error) {
        throw new Error(`Scraping error: ${error.message}`);
    } finally {
        await browser.close();
    }
};

module.exports = { scrapeAttendance };
