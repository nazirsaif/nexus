import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Meeting } from '../../types';
import { Link } from 'react-router-dom';

interface MeetingNotificationProps {
  meeting: Meeting;
  type: 'upcoming' | 'reminder' | 'status';
  onDismiss?: () => void;
}

export const MeetingNotification: React.FC<MeetingNotificationProps> = ({
  meeting,
  type,
  onDismiss
}) => {
  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Get notification content based on type
  const getNotificationContent = () => {
    switch (type) {
      case 'upcoming':
        return {
          title: 'Upcoming Meeting',
          message: `You have a meeting scheduled for ${formatDate(meeting.startTime)} at ${formatTime(meeting.startTime)}`,
          icon: <Calendar size={16} className="text-primary-600" />
        };
      case 'reminder':
        return {
          title: 'Meeting Reminder',
          message: `Your meeting "${meeting.title}" starts in 15 minutes`,
          icon: <Clock size={16} className="text-accent-600" />
        };
      case 'status':
        return {
          title: 'Meeting Status Update',
          message: `Your meeting "${meeting.title}" has been ${meeting.status}`,
          icon: <AlertCircle size={16} className="text-secondary-600" />
        };
      default:
        return {
          title: 'Meeting Notification',
          message: `Regarding your meeting "${meeting.title}"`,
          icon: <Calendar size={16} className="text-gray-600" />
        };
    }
  };

  const content = getNotificationContent();

  return (
    <Card className={`transition-colors duration-200 ${type === 'reminder' ? 'bg-primary-50' : ''}`}>
      <CardBody className="flex items-start p-4">
        <div className="p-2 rounded-full bg-primary-100 mr-3">
          {content.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">
              {content.title}
            </span>
            {type === 'reminder' && (
              <Badge variant="primary" size="sm" rounded>Now</Badge>
            )}
          </div>
          
          <p className="text-gray-600 mt-1">
            {content.message}
          </p>
          
          <div className="flex items-center gap-2 mt-3">
            <Link to={`/meetings`}>
              <Button size="sm" variant="outline">View Details</Button>
            </Link>
            {onDismiss && (
              <Button size="sm" variant="ghost" onClick={onDismiss}>Dismiss</Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};