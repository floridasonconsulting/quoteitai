import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Play, 
  Square, 
  Download, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { 
  quoteWorkflowSteps, 
  recordStep, 
  prepareForRecording,
  downloadAllFrames,
  exportSessionData,
  generateRecordingInstructions,
  type RecordingSession,
  type RecordingFrame
} from '@/lib/demo-recorder';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function DemoRecorder() {
  const navigate = useNavigate();
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handlePrepare = async () => {
    setIsPreparing(true);
    setError(null);
    
    try {
      await prepareForRecording();
      toast.success('Sample data prepared successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to prepare sample data';
      setError(message);
      toast.error(message);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleStartRecording = async () => {
    setIsRecording(true);
    setError(null);
    setCurrentStepIndex(0);

    const newSession: RecordingSession = {
      id: `recording-${Date.now()}`,
      startTime: Date.now(),
      frames: [],
      completed: false
    };
    setSession(newSession);

    try {
      // Record each step
      for (let i = 0; i < quoteWorkflowSteps.length; i++) {
        const step = quoteWorkflowSteps[i];
        setCurrentStepIndex(i);

        // Navigate if route is specified
        if (step.route) {
          navigate(step.route);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for navigation
        }

        // Record the step
        const frame = await recordStep(step, newSession.id);
        
        newSession.frames.push(frame);
        setSession({ ...newSession });

        toast.success(`Captured: ${step.name}`);
      }

      newSession.completed = true;
      setSession({ ...newSession });
      toast.success('Recording completed!');
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Recording failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsRecording(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (session) {
      toast.info('Recording stopped');
    }
  };

  const handleDownloadFrames = () => {
    if (session && session.frames.length > 0) {
      downloadAllFrames(session.frames);
      toast.success(`Downloading ${session.frames.length} frames`);
    }
  };

  const handleExportSession = () => {
    if (session) {
      exportSessionData(session);
      toast.success('Session data exported');
    }
  };

  const handleDownloadInstructions = () => {
    const instructions = generateRecordingInstructions();
    const blob = new Blob([instructions], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'recording-instructions.md';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Instructions downloaded');
  };

  const progress = session 
    ? (session.frames.length / quoteWorkflowSteps.length) * 100 
    : 0;

  const currentStep = quoteWorkflowSteps[currentStepIndex];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-6 w-6" />
            Demo Workflow Recorder
          </CardTitle>
          <CardDescription>
            Automated screenshot capture for creating demo GIFs and videos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preparation Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 1: Prepare Sample Data</h3>
            <p className="text-sm text-muted-foreground">
              Generate realistic sample data for the recording workflow
            </p>
            <Button
              onClick={handlePrepare}
              disabled={isPreparing || isRecording}
            >
              {isPreparing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                'Prepare Sample Data'
              )}
            </Button>
          </div>

          {/* Recording Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Step 2: Record Workflow</h3>
            <p className="text-sm text-muted-foreground">
              Automatically capture screenshots for all {quoteWorkflowSteps.length} workflow steps
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleStartRecording}
                disabled={isRecording || isPreparing}
                variant="default"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
              <Button
                onClick={handleStopRecording}
                disabled={!isRecording}
                variant="destructive"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop Recording
              </Button>
            </div>
          </div>

          {/* Progress Display */}
          {session && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{session.frames.length} / {quoteWorkflowSteps.length} steps</span>
                </div>
                <Progress value={progress} />
              </div>

              {isRecording && currentStep && (
                <Alert>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <AlertDescription>
                    Recording: {currentStep.name}
                  </AlertDescription>
                </Alert>
              )}

              {session.completed && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    Recording completed successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Export Section */}
          {session && session.frames.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Step 3: Export Frames</h3>
              <p className="text-sm text-muted-foreground">
                Download frames and convert to GIF using tools like ezgif.com or ffmpeg
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleDownloadFrames}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download All Frames ({session.frames.length})
                </Button>
                <Button
                  onClick={handleExportSession}
                  variant="outline"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Session Data
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Recording Instructions</h3>
            <p className="text-sm text-muted-foreground">
              Download detailed step-by-step instructions for manual screen recording
            </p>
            <Button
              onClick={handleDownloadInstructions}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Download Instructions
            </Button>
          </div>

          {/* Workflow Steps Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Workflow Steps</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quoteWorkflowSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{step.name}</h4>
                      {session?.frames[index] && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Captured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    {step.route && (
                      <Badge variant="outline" className="text-xs">
                        {step.route}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.delay}ms
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Post-Processing Tips */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold">Post-Processing Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Use ezgif.com or ffmpeg to convert frames to GIF</li>
              <li>Target file size: under 5MB for web</li>
              <li>Frame rate: 15-20 fps for smooth animation</li>
              <li>Add text overlays to highlight key features</li>
              <li>Optimize with gifsicle or ImageOptim</li>
              <li>Consider creating both GIF and MP4 versions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
