const calculateAnalytics = (rawData) => {
    // rawData shape: { overall: 85, subjects: [{ name, attended, conducted, percentage }] }
    // As per user requirement: Target = 75%
    const targetPercentage = 75;

    const subjects = rawData.subjects.map(subject => {
        const { attended, conducted, percentage } = subject;
        let classesNeeded = 0;
        let safeToSkip = 0;

        if (percentage < targetPercentage) {
            // Formula: x = Math.ceil((targetPercentage/100 * conducted - attended) / (1 - targetPercentage/100))
            classesNeeded = Math.ceil((targetPercentage / 100 * conducted - attended) / (1 - targetPercentage / 100));
        } else if (percentage >= targetPercentage) {
            // Formula: x = Math.floor((attended - targetPercentage/100 * conducted) / (targetPercentage/100))
            safeToSkip = Math.floor((attended - (targetPercentage / 100 * conducted)) / (targetPercentage / 100));
        }

        return {
            ...subject,
            classesNeeded: Math.max(0, classesNeeded),
            safeToSkip: Math.max(0, safeToSkip)
        };
    });

    return {
        overall: rawData.overall,
        subjects
    };
};

module.exports = { calculateAnalytics };
