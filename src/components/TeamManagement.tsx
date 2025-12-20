import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, UserPlus, Mail, Shield, ShieldCheck, X } from 'lucide-react';
import { useOrganizationSeats } from '@/hooks/useOrganizationSeats';
import { UpgradeModal } from './UpgradeModal';

interface TeamMember {
    id: string;
    email: string;
    role: 'owner' | 'member';
    joined_at: string;
}

export function TeamManagement() {
    const { user, organizationId, userRole } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInviting, setIsInviting] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { used: seatsUsed, limit: seatLimit, tier: currentTier, loading: seatsLoading } = useOrganizationSeats(organizationId);
    const navigate = useNavigate();

    const isOwner = userRole === 'max' || userRole === 'admin';

    useEffect(() => {
        if (organizationId) {
            fetchMembers();
        }
    }, [organizationId]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            // Fetch all profiles in the same organization
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, role, created_at')
                .eq('organization_id', organizationId);

            if (error) throw error;

            const formattedMembers: TeamMember[] = data.map((m: any) => ({
                id: m.id,
                email: m.email || 'Unknown',
                role: m.role as 'owner' | 'member',
                joined_at: m.created_at || new Date().toISOString()
            }));

            setMembers(formattedMembers);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error('Failed to load team members');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;

        // Pre-validation using the hook
        if (seatsUsed >= seatLimit && currentTier !== 'max_ai') {
            setShowUpgradeModal(true);
            return;
        }

        setIsInviting(true);
        try {
            toast.info('Sending invitation to ' + inviteEmail);

            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: { email: inviteEmail, organizationId }
            });

            if (error) {
                // Check if it's a seat limit error
                if (error.message?.includes('ERR_SEAT_LIMIT_REACHED')) {
                    setShowUpgradeModal(true);
                } else {
                    throw error;
                }
                return;
            }

            toast.success('Invitation sent!');
            setInviteEmail('');
            fetchMembers();
        } catch (error) {
            console.error('Error inviting member:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
            toast.error(errorMessage);
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (memberId === user?.id) {
            toast.error('You cannot remove yourself');
            return;
        }

        try {
            // Removing a member now means setting their organization_id to null 
            // and optionally resetting their role (or deleting the profile if preferred)
            // For now, let's keep it consistent with the user's intent: remove from org.
            const { error } = await supabase
                .from('profiles')
                .update({ organization_id: null, role: 'member' } as any)
                .eq('id', memberId)
                .eq('organization_id', organizationId);

            if (error) throw error;

            toast.success('Member removed');
            fetchMembers();
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
        }
    };

    const isPro = userRole === 'pro' || userRole === 'business' || userRole === 'max_ai' || userRole === 'max' || userRole === 'admin';

    if (!isPro) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Team Management
                        <Badge variant="secondary" className="ml-auto">Pro / Business</Badge>
                    </CardTitle>
                    <CardDescription>
                        Upgrade to Pro or Business to build your team and collaborate.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mb-4">
                        <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm space-y-1">
                            <p className="font-medium">Team Benefits:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li><strong>Pro ($49/mo)</strong>: 3 Users included, $15/mo per extra</li>
                                <li><strong>Business ($99/mo)</strong>: 10 Users included, AI SOW Drafting</li>
                                <li><strong>Max AI ($249/mo)</strong>: Unlimited Users, Custom AI Training</li>
                                <li>Shared item catalog and company settings</li>
                                <li>Owner visibility for all team data</li>
                            </ul>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => navigate('/settings?tab=subscription')}>
                        View Pricing
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Team Management
                        </CardTitle>
                        <CardDescription>
                            Manage your team members and roles
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                        {members.length} Members
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {isOwner && (
                    <form onSubmit={handleInvite} className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="invite-email" className="sr-only">Email Address</Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                disabled={seatsUsed >= seatLimit && currentTier !== 'max_ai'}
                            />
                        </div>
                        <Button type="submit" disabled={isInviting || !inviteEmail || (seatsUsed >= seatLimit && currentTier !== 'max_ai')}>
                            {isInviting ? (
                                'Inviting...'
                            ) : (
                                <>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Invite
                                </>
                            )}
                        </Button>
                    </form>
                )}

                <div className="space-y-3">
                    <Label>Team Members</Label>
                    <div className="border rounded-lg divide-y bg-card">
                        {isLoading ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">
                                Loading team members...
                            </div>
                        ) : members.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                No team members yet.
                            </div>
                        ) : (
                            members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Mail className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{member.email}</p>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="h-5 px-1.5 text-xs capitalize">
                                                    {member.role === 'owner' ? (
                                                        <Shield className="h-3 w-3 mr-1 text-blue-500" />
                                                    ) : (
                                                        <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                                                    )}
                                                    {member.role}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Joined {new Date(member.joined_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isOwner && member.id !== user?.id && (
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveMember(member.id)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </CardContent>
            <UpgradeModal
                isOpen={showUpgradeModal}
                tier={currentTier}
                onClose={() => setShowUpgradeModal(false)}
            />
        </Card>
    );
}
