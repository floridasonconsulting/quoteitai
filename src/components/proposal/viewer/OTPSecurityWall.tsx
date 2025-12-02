import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OTPSecurityWallProps {
  shareToken: string;
  onVerified: (sessionToken: string) => void;
  onExpired: () => void;
}

export function OTPSecurityWall({ shareToken, onVerified, onExpired }: OTPSecurityWallProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('generate-access-code', {
        body: { shareToken, email }
      });

      if (functionError) throw functionError;

      if (data?.error) {
        if (data.expired) {
          onExpired();
          return;
        }
        throw new Error(data.error);
      }

      setExpiresIn(data.expiresIn || 900);
      setStep('code');
      toast.success('Access code sent to your email');
      
      // Auto-clear code input after 15 minutes
      setTimeout(() => {
        setCode('');
        setStep('email');
        setError('Code expired. Please request a new one.');
      }, (data.expiresIn || 900) * 1000);
    } catch (err) {
      console.error('Error generating access code:', err);
      setError(err instanceof Error ? err.message : 'Failed to send access code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('verify-access-code', {
        body: { shareToken, email, code }
      });

      if (functionError) throw functionError;

      if (data?.error) {
        throw new Error(data.error);
      }

      // Store session token in sessionStorage
      sessionStorage.setItem('proposal_session', JSON.stringify({
        token: data.sessionToken,
        email,
        expiresAt: data.expiresAt,
        shareToken
      }));

      toast.success('Access verified!');
      onVerified(data.sessionToken);
    } catch (err) {
      console.error('Error verifying code:', err);
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    setStep('email');
    setCode('');
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Secure Proposal Access</CardTitle>
          <CardDescription>
            {step === 'email' 
              ? 'Enter your email to receive a secure access code'
              : 'Enter the 6-digit code sent to your email'
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                  className="h-12"
                />
                <p className="text-xs text-muted-foreground">
                  You must be authorized to view this proposal
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Access Code
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Access Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  disabled={loading}
                  autoFocus
                  className="h-12 text-center text-2xl tracking-widest font-mono"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Code sent to {email}
                  {expiresIn > 0 && ` • Expires in ${Math.floor(expiresIn / 60)}m`}
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={loading || code.length !== 6}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify & Access
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={handleResendCode}
                disabled={loading}
              >
                Use a different email
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t text-center text-xs text-muted-foreground">
            <p>This proposal is protected to prevent unauthorized access.</p>
            <p className="mt-1">If you need assistance, please contact the sender.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
