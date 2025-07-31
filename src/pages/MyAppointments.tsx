import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PatientHeader } from "@/components/PatientHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, Clock, MapPin, Video, Phone, ArrowLeft, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  appointment_date: string;
  appointment_time: string;
}

export default function MyAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchAllAppointments();
  }, [user, navigate]);

  const fetchAllAppointments = async () => {
    if (!user) return;

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
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

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
          : isPast(appointmentDate)
          ? format(appointmentDate, 'EEEE, MMM dd, yyyy')
          : format(appointmentDate, 'EEEE, MMM dd, yyyy');

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
          doctorAvatar: appointment.doctors?.avatar_url || "/placeholder-doctor.jpg",
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time
        };
      }) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-medical-success/20 text-medical-success border-medical-success/30';
      case 'pending': return 'bg-medical-warning/20 text-medical-warning border-medical-warning/30';
      case 'cancelled': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'completed': return 'bg-muted/20 text-muted-foreground border-muted/30';
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

  const filterAppointments = (filterType: string) => {
    const now = new Date();
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      
      switch (filterType) {
        case 'upcoming':
          return appointmentDate >= now && (appointment.status === 'confirmed' || appointment.status === 'pending');
        case 'past':
          return appointmentDate < now || appointment.status === 'completed';
        case 'cancelled':
          return appointment.status === 'cancelled';
        default:
          return true;
      }
    });
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          {/* Doctor Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-medical-blue/20">
            <AvatarImage src={appointment.doctorAvatar} alt={appointment.doctorName} />
            <AvatarFallback className="bg-medical-blue text-white">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>

          {/* Appointment Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  {appointment.doctorName.startsWith('Dr.') ? appointment.doctorName : `Dr. ${appointment.doctorName}`}
                </h3>
                <p className="text-medical-teal font-medium">{appointment.specialty}</p>
              </div>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {appointment.date}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                {appointment.time}
              </div>
              <div className="flex items-center">
                {getTypeIcon(appointment.type)}
                <span className="ml-2 capitalize">
                  {appointment.type === 'in-person' ? 'In-Person' : appointment.type}
                </span>
              </div>
              {appointment.location && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {appointment.location}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2">
            {appointment.type === 'video' && appointment.status === 'confirmed' && (
              <Button size="sm" className="bg-medical-teal hover:bg-medical-teal/90">
                <Video className="w-4 h-4 mr-1" />
                Join
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="border-medical-blue/30 text-medical-blue hover:bg-medical-blue/10"
              onClick={() => navigate(`/appointment/${appointment.id}`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PatientHeader />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <Calendar className="h-12 w-12 text-medical-blue animate-pulse mx-auto" />
            <p className="text-muted-foreground">Loading your appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">My Appointments</h1>
            <p className="text-muted-foreground">Manage and view all your medical appointments</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-medical-blue">{appointments.length}</div>
                <div className="text-sm text-muted-foreground">Total Appointments</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-medical-teal">{filterAppointments('upcoming').length}</div>
                <div className="text-sm text-muted-foreground">Upcoming</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-medical-success">{filterAppointments('past').length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{filterAppointments('cancelled').length}</div>
                <div className="text-sm text-muted-foreground">Cancelled</div>
              </CardContent>
            </Card>
          </div>

          {/* Appointments Tabs */}
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Appointments</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {appointments.length === 0 ? (
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-12 text-center">
                    <Calendar className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No appointments yet</h3>
                    <p className="text-muted-foreground mb-4">Start by booking your first appointment with a doctor.</p>
                    <Button onClick={() => navigate('/')} className="bg-medical-blue hover:bg-medical-blue/90">
                      Find Doctors
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                appointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))
              )}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-4">
              {filterAppointments('upcoming').map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
              {filterAppointments('upcoming').length === 0 && (
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No upcoming appointments scheduled.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {filterAppointments('past').map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
              {filterAppointments('past').length === 0 && (
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No past appointments found.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-4">
              {filterAppointments('cancelled').map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
              {filterAppointments('cancelled').length === 0 && (
                <Card className="bg-gradient-card shadow-card">
                  <CardContent className="p-8 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No cancelled appointments.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}