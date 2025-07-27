import { Calendar, Clock, MapPin, Video, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'phone';
  status: 'confirmed' | 'pending' | 'cancelled';
  location?: string;
  doctorAvatar: string;
}

export function UpcomingAppointments() {
  const appointments: Appointment[] = [
    {
      id: "1",
      doctorName: "Emily Chen",
      specialty: "Cardiology",
      date: "Today",
      time: "2:30 PM",
      type: "video",
      status: "confirmed",
      doctorAvatar: "/placeholder-doctor1.jpg"
    },
    {
      id: "2", 
      doctorName: "Michael Rodriguez",
      specialty: "Dermatology",
      date: "Tomorrow",
      time: "10:00 AM",
      type: "in-person",
      status: "confirmed",
      location: "Downtown Medical Center",
      doctorAvatar: "/placeholder-doctor2.jpg"
    },
    {
      id: "3",
      doctorName: "Sarah Williams",
      specialty: "General Medicine",
      date: "Friday",
      time: "3:15 PM", 
      type: "in-person",
      status: "pending",
      location: "Northside Clinic",
      doctorAvatar: "/placeholder-doctor3.jpg"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-medical-success/20 text-medical-success border-medical-success/30';
      case 'pending': return 'bg-medical-warning/20 text-medical-warning border-medical-warning/30';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center text-foreground">
          <Calendar className="mr-2 h-5 w-5 text-medical-blue" />
          Upcoming Appointments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <div 
            key={appointment.id}
            className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:border-medical-blue/30 transition-colors"
          >
            {/* Doctor Avatar */}
            <Avatar className="h-12 w-12">
              <AvatarImage src={appointment.doctorAvatar} alt={appointment.doctorName} />
              <AvatarFallback className="bg-medical-blue text-white">
                {appointment.doctorName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            {/* Appointment Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">Dr. {appointment.doctorName}</h4>
                  <p className="text-sm text-medical-teal">{appointment.specialty}</p>
                </div>
                <Badge className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {appointment.date} at {appointment.time}
                </div>
                <div className="flex items-center">
                  {getTypeIcon(appointment.type)}
                  <span className="ml-1 capitalize">
                    {appointment.type === 'in-person' ? appointment.location : appointment.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {appointment.type === 'video' && appointment.status === 'confirmed' && (
                <Button size="sm" className="bg-medical-teal hover:bg-medical-teal/90">
                  <Video className="w-4 h-4 mr-1" />
                  Join
                </Button>
              )}
              <Button variant="outline" size="sm" className="border-medical-blue/30 text-medical-blue hover:bg-medical-blue/10">
                Details
              </Button>
            </div>
          </div>
        ))}

        {appointments.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-foreground">No upcoming appointments</h3>
            <p className="mt-1 text-sm text-muted-foreground">Book an appointment with a doctor to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}