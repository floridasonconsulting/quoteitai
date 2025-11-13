import { useState, useEffect } from 'react';
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
  Loader2,
  Film,
  ImagePlay,
  Trash2
} from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  quoteWorkflowSteps, 
  recordStep, 
  prepareForRecording,
  downloadAllFrames,
  exportSessionData,
  generateRecordingInstructions,
  saveSessionToStorage,
  loadSessionFromStorage,
  clearSessionFromStorage,
  type RecordingSession,
  type RecordingFrame
} from '@/lib/demo-recorder';
import {
  generateMP4,
  generateGIF,
  downloadBlob,
  estimateFileSizes
} from '@/lib/video-generator';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function DemoRecorder() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState('');
  const [videoQuality, setVideoQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [gifWidth, setGifWidth] = useState<number>(1024);

  // Load existing session from storage on mount
  useEffect(() => {
    const savedSession = loadSessionFromStorage();
    if (savedSession) {
      setSession(savedSession);
      toast.info(`Loaded previous recording session with ${savedSession.frames.length} frames`);
    }
  }, []);

  const handlePrepare = async () => {
    if (!user) {
      const message = 'You must be logged in to prepare sample data';
      setError(message);
      toast.error(message);
      return;
    }

    setIsPreparing(true);
    setError(null);
    
    try {
      await prepareForRecording(user.id);
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
    if (!user) {
      const message = 'You must be logged in to start recording';
      setError(message);
      toast.error(message);
      return;
    }

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
        
        // Save to sessionStorage after each frame
        saveSessionToStorage(newSession);

        toast.success(`Captured: ${step.name}`);
      }

      newSession.completed = true;
      setSession({ ...newSession });
      
      // Save completed session to storage
      saveSessionToStorage(newSession);
      
      toast.success('Recording completed!');
      
      // Navigate back to demo-recorder page
      navigate('/demo-recorder');
      
      // Scroll to export section after navigation
      setTimeout(() => {
        const exportSection = document.querySelector('[data-export-section]');
        if (exportSection) {
          exportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      
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
    setCurrentStepIndex(0);
    
    // Save current state before stopping
    if (session) {
      saveSessionToStorage(session);
    }
    
    toast.info('Recording stopped');
  };

  const handleClearSession = () => {
    clearSessionFromStorage();
    setSession(null);
    setCurrentStepIndex(0);
    setError(null);
    toast.success('Session cleared');
  };

  const handleDownloadFrames = async () => {
    if (session && session.frames.length > 0) {
      // Show alert about browser permissions
      toast.info('Starting download... Your browser may ask to allow multiple downloads.', {
        duration: 6000
      });
      
      toast.loading(`Starting download of ${session.frames.length} frames...`);
      try {
        await downloadAllFrames(session.frames);
        toast.success(`All ${session.frames.length} frames downloaded! Check your downloads folder.`, {
          duration: 5000
        });
      } catch (error) {
        toast.error('Some frames may not have downloaded. Check browser permissions and try again.');
      }
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

  const handleGenerateMP4 = async () => {
    if (!session || session.frames.length === 0) return;

    setIsGeneratingVideo(true);
    setError(null);
    setVideoProgress(0);
    setVideoStatus('Starting...');

    try {
      const blob = await generateMP4(session.frames, {
        fps: 2,
        quality: videoQuality,
        onProgress: (progress, status) => {
          setVideoProgress(progress);
          setVideoStatus(status);
        },
      });

      const filename = `quote-workflow-${Date.now()}.mp4`;
      downloadBlob(blob, filename);
      toast.success(`MP4 video generated! (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate video';
      setError(message);
      toast.error(message);
    } finally {
      setIsGeneratingVideo(false);
      setVideoProgress(0);
      setVideoStatus('');
    }
  };

  const handleGenerateGIF = async () => {
    if (!session || session.frames.length === 0) return;

    setIsGeneratingVideo(true);
    setError(null);
    setVideoProgress(0);
    setVideoStatus('Starting...');

    try {
      const blob = await generateGIF(session.frames, {
        fps: 2,
        width: gifWidth,
        onProgress: (progress, status) => {
          setVideoProgress(progress);
          setVideoStatus(status);
        },
      });

      const filename = `quote-workflow-${Date.now()}.gif`;
      downloadBlob(blob, filename);
      toast.success(`GIF generated! (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate GIF';
      setError(message);
      toast.error(message);
    } finally {
      setIsGeneratingVideo(false);
      setVideoProgress(0);
      setVideoStatus('');
    }
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

          {/* Export Section - Prominent Display */}
          {session && session.frames.length > 0 && (
            <div className="space-y-4 p-6 border-2 border-primary/20 rounded-lg bg-primary/5" data-export-section>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <h3 className="text-xl font-bold">Recording {session.completed ? 'Complete' : 'In Progress'}! ({session.frames.length} frames captured)</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearSession}
                  disabled={isRecording || isGeneratingVideo}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Session
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose how you want to export your recorded workflow:
              </p>

              {/* Video Generation */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">Automated Video Generation</h4>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">MP4 Quality</label>
                    <Select
                      value={videoQuality}
                      onValueChange={(value: 'high' | 'medium' | 'low') => setVideoQuality(value)}
                      disabled={isGeneratingVideo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High (Best Quality)</SelectItem>
                        <SelectItem value="medium">Medium (Balanced)</SelectItem>
                        <SelectItem value="low">Low (Smaller Size)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">GIF Width</label>
                    <Select
                      value={gifWidth.toString()}
                      onValueChange={(value) => setGifWidth(parseInt(value))}
                      disabled={isGeneratingVideo}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1920">1920px (Full HD)</SelectItem>
                        <SelectItem value="1280">1280px (HD)</SelectItem>
                        <SelectItem value="1024">1024px (Balanced)</SelectItem>
                        <SelectItem value="800">800px (Smaller)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleGenerateMP4}
                    disabled={isGeneratingVideo}
                    className="flex-1 sm:flex-initial"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Film className="h-4 w-4 mr-2" />
                        Generate MP4
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleGenerateGIF}
                    disabled={isGeneratingVideo}
                    variant="secondary"
                    className="flex-1 sm:flex-initial"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ImagePlay className="h-4 w-4 mr-2" />
                        Generate GIF
                      </>
                    )}
                  </Button>
                </div>

                {isGeneratingVideo && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{videoStatus}</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <Progress value={videoProgress} />
                  </div>
                )}
              </div>

              {/* Download All Frames - Primary Action */}
              <div className="space-y-3 p-4 bg-background rounded-lg border-2 border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold text-lg">Download Screenshots</h4>
                </div>
                <Button
                  onClick={handleDownloadFrames}
                  size="lg"
                  variant="default"
                  disabled={isGeneratingVideo}
                  className="w-full h-12 text-base"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download All {session.frames.length} Frames (PNG)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Your browser may ask for permission to download multiple files. Each frame will download as a separate PNG file to your downloads folder.
                </p>
              </div>

              {/* Additional Export Options */}
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm">Additional Options</h4>
                <Button
                  onClick={handleExportSession}
                  variant="outline"
                  disabled={isGeneratingVideo}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Session Metadata (JSON)
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

          {/* Video Generation Info */}
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold">About Automated Video Generation</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li><strong>MP4:</strong> Best for web embedding, social media, and presentations</li>
              <li><strong>GIF:</strong> Works everywhere, auto-plays, but larger file sizes</li>
              <li><strong>Frame Rate:</strong> 2 FPS optimized for step-by-step demos</li>
              <li><strong>Processing:</strong> Runs entirely in your browser using FFmpeg WebAssembly</li>
              <li><strong>Quality:</strong> High quality preserves details but increases file size</li>
              <li><strong>No Upload:</strong> All processing happens locally - your frames never leave your device</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
