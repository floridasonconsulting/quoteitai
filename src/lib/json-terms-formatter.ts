/**
 * Shared JSON Terms Formatter
 * Converts structured JSON terms/conditions into human-readable formatted text
 * Used by both the proposal viewer and PDF generator
 */

/**
 * Format a value safely for display
 */
const formatValue = (val: any): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return val.toString();
    if (Array.isArray(val)) return val.map(formatValue).join(', ');
    if (typeof val === 'object' && val !== null) {
        if (val.description) return val.description;
        if (val.name) return val.name;
        return Object.values(val).map(formatValue).join(' - ');
    }
    return '';
};

/**
 * Convert JSON terms content to human-readable markdown-like format
 * Handles pool contractor specific fields and general business terms
 */
export function convertJsonToReadable(jsonContent: any): string {
    let readable = '';

    // Project Overview
    if (jsonContent.projectOverview) {
        readable += `## Project Overview\n${formatValue(jsonContent.projectOverview)}\n\n`;
    }

    // Work Breakdown / Phases
    if (jsonContent.workBreakdown && Array.isArray(jsonContent.workBreakdown)) {
        jsonContent.workBreakdown.forEach((phase: any) => {
            const phaseName = phase.phase || phase.title || phase.name || 'Phase';
            readable += `### ${phaseName}\n`;
            if (phase.description) readable += `${phase.description}\n`;

            if (phase.tasks && Array.isArray(phase.tasks)) {
                phase.tasks.forEach((task: any) => readable += `• ${formatValue(task)}\n`);
            }
            if (phase.duration) readable += `Duration: ${phase.duration}\n`;
            if (phase.dependencies) readable += `Dependencies: ${phase.dependencies}\n`;
            readable += '\n';
        });
    }

    // Deliverables
    if (jsonContent.deliverables && Array.isArray(jsonContent.deliverables)) {
        readable += `## Deliverables\n`;
        jsonContent.deliverables.forEach((d: any) => readable += `• ${formatValue(d)}\n`);
        readable += '\n';
    }

    // Timeline
    if (jsonContent.timeline) {
        readable += `## Timeline & Milestones\n`;
        const timeline = jsonContent.timeline;
        if (typeof timeline === 'string') {
            readable += `${timeline}\n\n`;
        } else if (typeof timeline === 'object') {
            if (timeline.startDate) readable += `**Start Date:** ${timeline.startDate}\n`;
            if (timeline.completionDate) readable += `**Completion:** ${timeline.completionDate}\n`;

            if (timeline.milestones && Array.isArray(timeline.milestones)) {
                timeline.milestones.forEach((m: any) => {
                    const date = m.date ? ` (${m.date})` : '';
                    readable += `• ${m.name || m.description}${date}\n`;
                });
            }
            readable += '\n';
        }
    }

    // Acceptance Criteria
    if (jsonContent.acceptanceCriteria) {
        readable += `## Acceptance Criteria\n${formatValue(jsonContent.acceptanceCriteria)}\n\n`;
    }

    // Exclusions
    if (jsonContent.exclusions && Array.isArray(jsonContent.exclusions)) {
        readable += `## Exclusions\n`;
        jsonContent.exclusions.forEach((e: any) => readable += `• ${formatValue(e)}\n`);
        readable += '\n';
    }

    // Responsibilities Matrix (Pool/Contractor specific)
    if (jsonContent.responsibilitiesMatrix) {
        const matrix = jsonContent.responsibilitiesMatrix;

        if (matrix.poolContractorResponsibilities && Array.isArray(matrix.poolContractorResponsibilities)) {
            readable += `## Contractor Responsibilities\n`;
            matrix.poolContractorResponsibilities.forEach((r: any) => readable += `• ${formatValue(r)}\n`);
            readable += '\n';
        }

        if (matrix.poolContractorExclusions && Array.isArray(matrix.poolContractorExclusions)) {
            readable += `## Contractor Exclusions\n`;
            matrix.poolContractorExclusions.forEach((e: any) => readable += `• ${formatValue(e)}\n`);
            readable += '\n';
        }

        if (matrix.customerResponsibilities && Array.isArray(matrix.customerResponsibilities)) {
            readable += `## Customer Responsibilities\n`;
            matrix.customerResponsibilities.forEach((r: any) => readable += `• ${formatValue(r)}\n`);
            readable += '\n';
        }
    }

    // Assumptions
    if (jsonContent.assumptions && Array.isArray(jsonContent.assumptions)) {
        readable += `## Assumptions\n`;
        jsonContent.assumptions.forEach((a: any) => readable += `• ${formatValue(a)}\n`);
        readable += '\n';
    }

    // Warranty Terms
    if (jsonContent.warrantyTerms) {
        readable += `## Warranty Terms\n`;
        const warranty = jsonContent.warrantyTerms;

        if (warranty.coverage) {
            readable += `**Coverage:** ${formatValue(warranty.coverage)}\n\n`;
        }

        if (warranty.exclusions && Array.isArray(warranty.exclusions)) {
            readable += `**Warranty Exclusions:**\n`;
            warranty.exclusions.forEach((e: any) => readable += `• ${formatValue(e)}\n`);
            readable += '\n';
        }

        if (warranty.voidConditions) {
            readable += `**Void Conditions:** ${formatValue(warranty.voidConditions)}\n`;
        }
        readable += '\n';
    }

    // Payment Schedule
    if (jsonContent.paymentSchedule && Array.isArray(jsonContent.paymentSchedule)) {
        readable += `## Payment Schedule\n`;
        jsonContent.paymentSchedule.forEach((payment: any) => {
            const milestone = payment.milestone || payment.name || 'Milestone';
            const percentage = payment.percentageDue || payment.percentage || payment.amount || '';
            readable += `• **${milestone}:** ${percentage}\n`;
        });
        readable += '\n';
    }

    // Change Management
    if (jsonContent.changeManagement) {
        readable += `## Change Management\n`;
        readable += `${formatValue(jsonContent.changeManagement)}\n\n`;
    }

    // Default and Collection Terms
    if (jsonContent.defaultAndCollectionTerms) {
        readable += `## Default & Collection Terms\n`;
        const terms = jsonContent.defaultAndCollectionTerms;

        if (terms.description) {
            readable += `${formatValue(terms.description)}\n\n`;
        }

        if (terms.importantNote) {
            readable += `**Important:** ${formatValue(terms.importantNote)}\n`;
        }
        readable += '\n';
    }

    return readable.trim();
}

/**
 * Parse and format terms content - handles both JSON and plain text
 * @param content The raw terms content (may be JSON or plain text)
 * @returns Formatted readable text
 */
export function formatTermsContent(content: string): string {
    if (!content) return '';

    const trimmed = content.trim();

    // Check if content is JSON
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            const jsonData = JSON.parse(trimmed);
            return convertJsonToReadable(jsonData);
        } catch (e) {
            // Not valid JSON, return as-is
            return content;
        }
    }

    // Handle TipTap editor format
    if (trimmed.includes('"type":"doc"')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
                return parsed.content
                    .map((p: any) => p.content?.map((c: any) => c.text).join('') || '')
                    .join('\n');
            }
        } catch (e) {
            // Not valid TipTap format
        }
    }

    // Plain text - return as-is
    return content;
}
