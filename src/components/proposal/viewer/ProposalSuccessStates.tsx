import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SuccessStateProps {
  type: 'accepted' | 'declined' | 'commented';
  salesRepName?: string;
  onClose?: () => void;
}

export function ProposalSuccessState({ type, salesRepName = 'our team', onClose }: SuccessStateProps) {
  const content = {
    accepted: {
      icon: <CheckCircle2 className="h-20 w-20 text-green-500" />,
      title: 'Thank You for Your Approval!',
      message: `We're excited to move forward with your project. ${salesRepName} will be contacting you soon to go over the next steps and finalize the details.`,
      bgColor: 'bg-green-50',
      textColor: 'text-green-900',
    },
    declined: {
      icon: <XCircle className="h-20 w-20 text-gray-500" />,
      title: 'We Appreciate Your Consideration',
      message: `Thank you for taking the time to review our proposal. We understand this project isn't the right fit at this time. If circumstances change or you have any questions, please don't hesitate to reach out.`,
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-900',
    },
    commented: {
      icon: <MessageSquare className="h-20 w-20 text-blue-500" />,
      title: 'Your Feedback Has Been Sent',
      message: `Thank you for your input. ${salesRepName} has received your comments and will respond shortly to address any questions or concerns.`,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-900',
    },
  };

  const state = content[type];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${state.bgColor}`}>
      <Card className="max-w-2xl w-full p-12 text-center space-y-6">
        <div className="flex justify-center">
          {state.icon}
        </div>
        
        <h1 className={`text-3xl font-bold ${state.textColor}`}>
          {state.title}
        </h1>
        
        <p className="text-lg text-muted-foreground leading-relaxed">
          {state.message}
        </p>
        
        {onClose && (
          <div className="pt-6">
            <Button onClick={onClose} size="lg">
              Close Window
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}