import { Calendar, Clock, MapPin, Video, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  type: 'in-person' | 'video' | 'phone';
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  location?: string;
  doctorAvatar: string;
}

export function UpcomingAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            doctors!appointments_doctor_id_fkey (
              specialty,
              avatar_url,
              user_id
            )
          `)
          .eq('patient_id', user.id)
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(5);

        if (error) {
          console.error('Error fetching appointments:', error);
          return;
        }

        // Get doctor profiles separately for display names
        const doctorIds = data?.map(appointment => appointment.doctors?.user_id).filter(Boolean) || [];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', doctorIds);

        const profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.user_id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const formattedAppointments: Appointment[] = data?.map(appointment => {
          const appointmentDate = new Date(appointment.appointment_date);
          const dateStr = isToday(appointmentDate) 
            ? 'Today'
            : isTomorrow(appointmentDate)
            ? 'Tomorrow'
            : format(appointmentDate, 'EEEE');

          const doctorProfile = profilesMap[appointment.doctors?.user_id];

          return {
            id: appointment.id,
            doctorName: doctorProfile?.display_name || 'Unknown Doctor',
            specialty: appointment.doctors?.specialty || 'General Practice',
            date: dateStr,
            time: format(new Date(`2000-01-01T${appointment.appointment_time}`), 'h:mm a'),
            type: appointment.type as 'in-person' | 'video' | 'phone',
            status: appointment.status as 'confirmed' | 'pending' | 'cancelled' | 'completed',
            location: appointment.location,
            doctorAvatar: appointment.doctors?.avatar_url || "/placeholder-doctor.jpg"
          };
        }) || [];

        setAppointments(formattedAppointments);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="h-12 w-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : appointments.map((appointment) => (
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
                  <h4 className="font-semibold text-foreground">{appointment.doctorName.startsWith('Dr.') ? appointment.doctorName : `Dr. ${appointment.doctorName}`}</h4>
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

        {!loading && appointments.length === 0 && (
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