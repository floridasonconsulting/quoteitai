import { ProposalSection } from '@/types/proposal';
import { Button } from '@/components/ui/button';
import { Edit3, FileText, CheckCircle, Clock, Target, ListChecks, Ban } from 'lucide-react';
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

        if (jsonContent.projectOverview) {
            readable += `## Project Overview\n${jsonContent.projectOverview}\n\n`;
        }

        if (jsonContent.workBreakdown && Array.isArray(jsonContent.workBreakdown)) {
            readable += `## Scope of Work\n`;
            jsonContent.workBreakdown.forEach((phase: any) => {
                readable += `### ${phase.phase || 'Phase'}\n`;
                if (phase.description) readable += `${phase.description}\n`;
                if (phase.tasks && Array.isArray(phase.tasks)) {
                    phase.tasks.forEach((task: string) => readable += `• ${task}\n`);
                }
                if (phase.duration) readable += `Duration: ${phase.duration}\n`;
                readable += '\n';
            });
        }

        if (jsonContent.deliverables && Array.isArray(jsonContent.deliverables)) {
            readable += `## Deliverables\n`;
            jsonContent.deliverables.forEach((d: string) => readable += `• ${d}\n`);
            readable += '\n';
        }

        if (jsonContent.timeline) {
            readable += `## Timeline & Milestones\n${typeof jsonContent.timeline === 'string' ? jsonContent.timeline : JSON.stringify(jsonContent.timeline)}\n\n`;
        }

        if (jsonContent.acceptanceCriteria) {
            readable += `## Acceptance Criteria\n${jsonContent.acceptanceCriteria}\n\n`;
        }

        if (jsonContent.exclusions && Array.isArray(jsonContent.exclusions)) {
            readable += `## Exclusions\n`;
            jsonContent.exclusions.forEach((e: string) => readable += `• ${e}\n`);
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
                if (title.toLowerCase().includes('overview')) icon = 'overview';
                if (title.toLowerCase().includes('scope')) icon = 'scope';
                if (title.toLowerCase().includes('deliverable')) icon = 'deliverables';
                if (title.toLowerCase().includes('timeline') || title.toLowerCase().includes('milestone')) icon = 'timeline';
                if (title.toLowerCase().includes('acceptance') || title.toLowerCase().includes('criteria')) icon = 'acceptance';
                if (title.toLowerCase().includes('exclusion')) icon = 'exclusions';
                currentSection = { title, content: '', icon };
            } else if (currentSection.title) {
                currentSection.content += line + '\n';
            } else if (line.trim()) {
                // Content before any header - create a general section
                if (!currentSection.title) {
                    currentSection = { title: 'Project Overview', content: '', icon: 'overview' };
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
            default: return <FileText className="w-5 h-5" />;
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
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        {section.title || 'Scope of Work'}
                    </h2>
                    {section.subtitle && (
                        <p className="text-white/70 mt-2">
                            {section.subtitle}
                        </p>
                    )}
                </div>

                {/* Scrollable SOW Content */}
                <div
                    ref={scrollContainerRef}
                    className="h-[calc(100%-120px)] overflow-y-auto px-6 py-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
                >
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
                                    {section.content || 'No scope of work content available.'}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
