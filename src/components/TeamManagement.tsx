import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Users, UserPlus, Mail, Shield, ShieldCheck, X } from 'lucide-react';

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

    const isOwner = userRole === 'max' || userRole === 'admin'; // For now, Max users are owners

    useEffect(() => {
        if (organizationId) {
            fetchMembers();
        }
    }, [organizationId]);

    const fetchMembers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('memberships' as any)
                .select(`
          user_id,
          role,
          created_at,
          profiles:user_id (email)
        `)
                .eq('organization_id', organizationId);

            if (error) throw error;

            const formattedMembers: TeamMember[] = data.map((m: any) => ({
                id: m.user_id,
                email: m.profiles?.email || 'Unknown',
                role: m.role,
                joined_at: m.created_at
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
        if (members.length >= 5) {
            toast.error('Team limit reached (Max 5 members)');
            return;
        }

        setIsInviting(true);
        try {
            // In a real app, this would call an Edge Function to create an invite and send an email
            // For now, we'll simulate the invite process or use a simplified direct member addition if the user exists
            toast.info('Sending invitation to ' + inviteEmail);

            const { data, error } = await supabase.functions.invoke('invite-team-member', {
                body: { email: inviteEmail, organizationId }
            });

            if (error) throw error;

            toast.success('Invitation sent!');
            setInviteEmail('');
            fetchMembers();
        } catch (error) {
            console.error('Error inviting member:', error);
            toast.error('Failed to send invitation');
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
            const { error } = await supabase
                .from('memberships' as any)
                .delete()
                .eq('user_id', memberId)
                .eq('organization_id', organizationId);

            if (error) throw error;

            toast.success('Member removed');
            fetchMembers();
        } catch (error) {
            console.error('Error removing member:', error);
            toast.error('Failed to remove member');
        }
    };

    if (userRole !== 'max' && userRole !== 'admin') {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Team Management
                        <Badge variant="secondary" className="ml-auto">Max AI</Badge>
                    </CardTitle>
                    <CardDescription>
                        Upgrade to Max AI to build your team and collaborate on quotes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg mb-4">
                        <ShieldCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm space-y-1">
                            <p className="font-medium">Max AI Team Benefits:</p>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                                <li>Include up to 5 team members</li>
                                <li>Shared item catalog and company settings</li>
                                <li>Private quotes and customers per representative</li>
                                <li>Owner visibility for all team data</li>
                                <li>Centralized billing</li>
                            </ul>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => toast.info('Redirecting to subscription...')}>
                        Upgrade to Max AI
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
                            Manage your team of up to 5 members
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                        {members.length} / 5 Members
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
                                disabled={members.length >= 5}
                            />
                        </div>
                        <Button type="submit" disabled={isInviting || !inviteEmail || members.length >= 5}>
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
        </Card>
    );
}
