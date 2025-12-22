import { ProposalSection } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Edit3, FileText, CheckCircle, Clock, Target, ListChecks, Ban, DollarSign, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';
import { useRef } from 'react';

interface ScopeOfWorkSlideProps {
    section: ProposalSection;
    isOwner?: boolean;
    onEditImage?: (currentUrl?: string) => void;
}

/**
 * Scope of Work Slide Component
 * Displays AI-generated SOW content with professional formatting
 */
export function ScopeOfWorkSlide({ section, isOwner, onEditImage }: ScopeOfWorkSlideProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Convert JSON SOW to readable text
    const convertJsonToReadable = (jsonContent: any): string => {
        let readable = '';

        // Helper to formatting values safely
        const formatValue = (val: any): string => {
            if (typeof val === 'string') return val;
            if (typeof val === 'number') return val.toString();
            if (Array.isArray(val)) return val.map(formatValue).join(', ');
            if (typeof val === 'object' && val !== null) {
                // If it's an object with 'description' or 'name', use that
                if (val.description) return val.description;
                if (val.name) return val.name;
                // Fallback to values
                return Object.values(val).map(formatValue).join(' - ');
            }
            return '';
        };

        if (jsonContent.projectOverview) {
            readable += `## Project Overview\n${formatValue(jsonContent.projectOverview)}\n\n`;
        }

        if (jsonContent.workBreakdown && Array.isArray(jsonContent.workBreakdown)) {
            readable += `## Scope of Work\n`;
            jsonContent.workBreakdown.forEach((phase: any) => {
                const phaseName = phase.phase || phase.title || phase.name || 'Phase';
                readable += `### ${phaseName}\n`;
                if (phase.description) readable += `${phase.description}\n`;

                if (phase.tasks && Array.isArray(phase.tasks)) {
                    phase.tasks.forEach((task: any) => readable += `• ${formatValue(task)}\n`);
                }
                if (phase.duration) readable += `Duration: ${phase.duration}\n`;
                readable += '\n';
            });
        }

        if (jsonContent.deliverables && Array.isArray(jsonContent.deliverables)) {
            readable += `## Deliverables\n`;
            jsonContent.deliverables.forEach((d: any) => readable += `• ${formatValue(d)}\n`);
            readable += '\n';
        }

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

        if (jsonContent.acceptanceCriteria) {
            readable += `## Acceptance Criteria\n${formatValue(jsonContent.acceptanceCriteria)}\n\n`;
        }

        if (jsonContent.exclusions && Array.isArray(jsonContent.exclusions)) {
            readable += `## Exclusions\n`;
            jsonContent.exclusions.forEach((e: any) => readable += `• ${formatValue(e)}\n`);
            readable += '\n';
        }

        return readable.trim();
    };

    // Parse SOW content - handle both markdown and JSON
    const parseSections = (content: string) => {
        if (!content) return [];

        // Try to detect if content is JSON
        const trimmed = content.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                const jsonData = JSON.parse(trimmed);
                // Convert JSON to markdown-like format
                content = convertJsonToReadable(jsonData);
            } catch (e) {
                // Not valid JSON, continue with original content
            }
        }

        const sections: { title: string; content: string; icon: string }[] = [];
        const lines = content.split('\n');
        let currentSection = { title: '', content: '', icon: 'document' };

        for (const line of lines) {
            // Check for markdown headers (## or # or ### or **)
            if (line.match(/^#{1,3}\s+/) || line.match(/^\*\*[^*]+\*\*$/)) {
                if (currentSection.title) {
                    sections.push({ ...currentSection });
                }
                const title = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
                let icon = 'document';

                // SOW Keywords
                if (title.toLowerCase().includes('overview')) icon = 'overview';
                if (title.toLowerCase().includes('scope')) icon = 'scope';
                if (title.toLowerCase().includes('deliverable')) icon = 'deliverables';
                if (title.toLowerCase().includes('timeline') || title.toLowerCase().includes('milestone')) icon = 'timeline';
                if (title.toLowerCase().includes('acceptance') || title.toLowerCase().includes('criteria')) icon = 'acceptance';
                if (title.toLowerCase().includes('exclusion')) icon = 'exclusions';

                // Terms Keywords
                if (title.toLowerCase().includes('payment') || title.toLowerCase().includes('cost') || title.toLowerCase().includes('billing')) icon = 'payment';
                if (title.toLowerCase().includes('warranty') || title.toLowerCase().includes('guarantee')) icon = 'warranty';
                if (title.toLowerCase().includes('liability') || title.toLowerCase().includes('insurance')) icon = 'liability';
                if (title.toLowerCase().includes('legal') || title.toLowerCase().includes('contract') || title.toLowerCase().includes('termination')) icon = 'legal';

                currentSection = { title, content: '', icon };
            } else if (currentSection.title) {
                currentSection.content += line + '\n';
            } else if (line.trim()) {
                // Content before any header - create a general section
                if (!currentSection.title) {
                    currentSection = { title: section.type === 'legal' ? 'Terms' : 'Project Overview', content: '', icon: section.type === 'legal' ? 'legal' : 'overview' };
                }
                currentSection.content += line + '\n';
            }
        }

        if (currentSection.title) {
            sections.push(currentSection);
        }

        return sections;
    };

    // Format content - convert markdown lists to clean bullets
    const formatContent = (content: string): string => {
        return content
            .replace(/^[-*]\s+/gm, '• ')  // Convert - or * to bullet
            .replace(/^\d+\.\s+/gm, '• ') // Convert numbered lists to bullets
            .trim();
    };

    const getIcon = (iconType: string) => {
        switch (iconType) {
            case 'overview': return <FileText className="w-5 h-5" />;
            case 'scope': return <ListChecks className="w-5 h-5" />;
            case 'deliverables': return <Target className="w-5 h-5" />;
            case 'timeline': return <Clock className="w-5 h-5" />;
            case 'acceptance': return <CheckCircle className="w-5 h-5" />;
            case 'exclusions': return <Ban className="w-5 h-5" />;
            // Terms Icons
            case 'payment': return <DollarSign className="w-5 h-5" />;
            case 'warranty': return <ShieldCheck className="w-5 h-5" />;
            case 'liability': return <AlertTriangle className="w-5 h-5" />;
            case 'legal': return <Scale className="w-5 h-5" />;
            default: return <FileText className="w-5 h-5" />;
        }
    };

    const touchStartY = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!e.touches || e.touches.length === 0) return;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!e.touches || e.touches.length === 0) return;
        if (touchStartY.current === null) return;

        const container = scrollContainerRef.current;
        if (!container) return;

        const currentY = e.touches[0].clientY;
        const diff = touchStartY.current - currentY;
        const { scrollTop, scrollHeight, clientHeight } = container;

        if (scrollHeight <= clientHeight) return;

        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

        if (diff > 0 && !isAtBottom) {
            e.stopPropagation();
        } else if (diff < 0 && !isAtTop) {
            e.stopPropagation();
        }
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const isScrollingUp = e.deltaY < 0;
        const isScrollingDown = e.deltaY > 0;

        const isAtTop = scrollTop <= 0;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

        if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
            e.stopPropagation();
        }
    };

    const sowSections = parseSections(section.content || '');

    return (
        <div
            className="relative h-full w-full overflow-hidden"
            style={{
                backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'linear-gradient(135deg, #1e3a5f 0%, #0f1f35 100%)',
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

            {/* Owner Edit Button */}
            {isOwner && (
                <div className="absolute top-4 right-4 z-50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditImage?.(section.backgroundImage)}
                        className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full font-bold uppercase tracking-wider text-[10px]"
                    >
                        <Edit3 className="w-3 h-3 mr-1" />
                        Edit Background
                    </Button>
                </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 h-full overflow-hidden">
                {/* Header */}
                <div className="text-center py-6 border-b border-white/20">
                    <div className="flex justify-center mb-3">
                        <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl">
                            {section.type === 'legal' ? (
                                <Scale className="w-8 h-8 text-white" />
                            ) : (
                                <FileText className="w-8 h-8 text-white" />
                            )}
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        {section.title || (section.type === 'legal' ? 'Terms & Conditions' : 'Scope of Work')}
                    </h2>
                    {section.subtitle && (
                        <p className="text-white/70 mt-2">
                            {section.subtitle}
                        </p>
                    )}
                </div>

                {/* Scrollable SOW Content */}
                className="h-[calc(100%-120px)] overflow-y-auto px-6 py-4 pb-40 md:pb-36 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent touch-pan-y"
                <div className="max-w-3xl mx-auto space-y-6">
                    {sowSections.length > 0 ? (
                        sowSections.map((sec, index) => (
                            <div
                                key={index}
                                className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-white/20 rounded-lg text-white">
                                        {getIcon(sec.icon)}
                                    </div>
                                    <h3 className="text-xl font-semibold text-white">
                                        {sec.title}
                                    </h3>
                                </div>
                                <div className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                                    {sec.content.trim()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                            <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                                {section.content || 'No content available.'}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </div >
    );
}
