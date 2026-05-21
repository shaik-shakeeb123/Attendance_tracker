/**
 * Parses the IMS student dashboard ExtJS JavaScript configuration (or HTML page containing it)
 * to extract attendance information.
 * 
 * Since the IMS portal returns an ExtJS configuration structure where data is embedded
 * inside JavaScript object declarations (rather than a rendered HTML DOM), we use a regex-based
 * parser to locate the rows and extract the displayfield values.
 */
const parseAttendance = (html) => {
    const subjects = [];
    
    if (typeof html !== 'string') {
        return { overall: 0, subjects: [] };
    }

    // Find the semesterActivity section
    const startIndex = html.indexOf("id:'semesterActivity'");
    if (startIndex === -1) {
        return { overall: 0, subjects: [] };
    }
    
    // Find where the attendanceTable section starts to bound our search
    const endIndex = html.indexOf("attendanceTable:", startIndex);
    const section = endIndex !== -1 ? html.substring(startIndex, endIndex) : html.substring(startIndex);
    
    // Regex to match bottom-border rows and capture their items contents
    const rowRegex = /componentCls:\s*['"]bottom-border['"][\s\S]*?items:\s*\[([\s\S]*?)\]/g;
    const valueRegex = /value\s*:\s*'([^']*?)'/g;
    const stripHtmlRegex = /<[^>]*>/g;

    let match;
    while ((match = rowRegex.exec(section)) !== null) {
        const itemsContent = match[1];
        const values = [];
        let valMatch;
        while ((valMatch = valueRegex.exec(itemsContent)) !== null) {
            // Remove HTML tags, unescape entities, and normalize whitespace
            const cleaned = valMatch[1]
                .replace(stripHtmlRegex, '')
                .replace(/&nbsp;/gi, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            values.push(cleaned);
        }
        
        if (values.length >= 5) {
            const sNoText = values[0];
            const name = values[1];
            const attendedText = values[2];
            const conductedText = values[3];
            const percentageText = values[4];

            const sNo = parseInt(sNoText, 10);
            const attended = parseInt(attendedText, 10) || 0;
            const conducted = parseInt(conductedText, 10) || 0;
            const percentage = parseFloat(percentageText) || 0;

            if (name && name !== 'SUBJECT CODE' && conducted > 0) {
                // Filter out S.No 3 to S.No 13 as per user request
                if (!isNaN(sNo) && sNo >= 3 && sNo <= 13) {
                    continue;
                }
                subjects.push({
                    name,
                    conducted,
                    attended,
                    percentage
                });
            }
        }
    }

    const totalConducted = subjects.reduce((sum, sub) => sum + sub.conducted, 0);
    const totalAttended = subjects.reduce((sum, sub) => sum + sub.attended, 0);
    const overall = totalConducted > 0 ? (totalAttended / totalConducted) * 100 : 0;

    return {
        overall: parseFloat(overall.toFixed(2)),
        subjects
    };
};

module.exports = { parseAttendance };
