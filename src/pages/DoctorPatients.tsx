import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, Calendar, Phone, Mail, MapPin, Clock, User, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Patient {
  user_id: string;
  display_name: string;
  email: string;
  phone?: string;
  totalAppointments: number;
  lastAppointment?: string;
  upcomingAppointments: number;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  location?: string;
  notes?: string;
  patient_name: string;
  patient_email: string;
}

const DoctorPatients = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchPatients = async () => {
    if (!user) return;
    
    try {
      // Get all appointments for this doctor
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('doctor_id', user.id)
        .order('appointment_date', { ascending: false });

      if (!appointments) return;

      // Get unique patient IDs
      const patientIds = [...new Set(appointments.map(apt => apt.patient_id))];
      
      // Get patient profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, phone')
        .in('user_id', patientIds);

      if (!profiles) return;

      // Create patients summary
      const patientsData = profiles.map(profile => {
        const patientAppointments = appointments.filter(apt => apt.patient_id === profile.user_id);
        const upcomingAppointments = patientAppointments.filter(apt => 
          new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
        );
        const lastAppointment = patientAppointments
          .filter(apt => new Date(apt.appointment_date) < new Date())
          .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())[0];

        return {
          user_id: profile.user_id,
          display_name: profile.display_name || 'Unknown Patient',
          email: profile.email || '',
          phone: profile.phone,
          totalAppointments: patientAppointments.length,
          lastAppointment: lastAppointment?.appointment_date,
          upcomingAppointments: upcomingAppointments.length
        };
      });

      // Format all appointments with patient info
      const formattedAppointments = appointments.map(appointment => {
        const patient = profiles.find(p => p.user_id === appointment.patient_id);
        return {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          type: appointment.type,
          status: appointment.status,
          location: appointment.location,
          notes: appointment.notes,
          patient_name: patient?.display_name || 'Unknown Patient',
          patient_email: patient?.email || ''
        };
      });

      setPatients(patientsData);
      setAllAppointments(formattedAppointments);
      setPatientsLoading(false);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatientsLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    const appointments = allAppointments
      .filter(apt => apt.patient_name === patient.display_name)
      .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
    setPatientAppointments(appointments);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user]);

  if (loading || patientsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="h-8 w-8 text-blue-400 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/doctor-dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <Heart className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-foreground">My Patients</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Patients List */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">All Patients ({patients.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {patients.map((patient) => (
                    <div
                      key={patient.user_id}
                      onClick={() => handlePatientSelect(patient)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPatient?.user_id === patient.user_id
                          ? 'bg-medical-blue/10 border-medical-blue'
                          : 'bg-background/50 hover:bg-background/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-medical-blue text-white">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground truncate">
                            {patient.display_name}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {patient.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {patient.totalAppointments} appointments
                            </span>
                            {patient.upcomingAppointments > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {patient.upcomingAppointments} upcoming
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Details */}
          <div className="lg:col-span-2">
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Info Card */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-medical-blue text-white">
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div>{selectedPatient.display_name}</div>
                        <div className="text-sm font-normal text-muted-foreground">
                          Patient Details
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedPatient.email}</span>
                      </div>
                      {selectedPatient.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedPatient.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {selectedPatient.totalAppointments} total appointments
                        </span>
                      </div>
                      {selectedPatient.lastAppointment && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Last visit: {new Date(selectedPatient.lastAppointment).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Appointments History */}
                <Card className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <CardTitle className="text-foreground">Appointment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="all" className="space-y-4 mt-4">
                        {patientAppointments.map((appointment) => (
                          <div key={appointment.id} className="border rounded-lg p-4 bg-background/50">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                  <span className="font-medium text-medical-blue">
                                    {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                                    {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Type: {appointment.type === 'video' ? 'Video Call' : 
                                        appointment.type === 'phone' ? 'Phone Call' : 'In-Person'}
                                </div>
                                {appointment.location && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    {appointment.location}
                                  </div>
                                )}
                                {appointment.notes && (
                                  <div className="text-sm text-muted-foreground">
                                    <strong>Notes:</strong> {appointment.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="upcoming" className="space-y-4 mt-4">
                        {patientAppointments
                          .filter(apt => new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled')
                          .map((appointment) => (
                            <div key={appointment.id} className="border rounded-lg p-4 bg-background/50">
                              {/* Same content as above */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium text-medical-blue">
                                      {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                                      {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                    <Badge className={getStatusColor(appointment.status)}>
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Type: {appointment.type === 'video' ? 'Video Call' : 
                                          appointment.type === 'phone' ? 'Phone Call' : 'In-Person'}
                                  </div>
                                  {appointment.location && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      {appointment.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </TabsContent>
                      
                      <TabsContent value="completed" className="space-y-4 mt-4">
                        {patientAppointments
                          .filter(apt => apt.status === 'completed')
                          .map((appointment) => (
                            <div key={appointment.id} className="border rounded-lg p-4 bg-background/50">
                              {/* Same content structure */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium text-medical-blue">
                                      {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                                      {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                    <Badge className={getStatusColor(appointment.status)}>
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Type: {appointment.type === 'video' ? 'Video Call' : 
                                          appointment.type === 'phone' ? 'Phone Call' : 'In-Person'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </TabsContent>
                      
                      <TabsContent value="cancelled" className="space-y-4 mt-4">
                        {patientAppointments
                          .filter(apt => apt.status === 'cancelled')
                          .map((appointment) => (
                            <div key={appointment.id} className="border rounded-lg p-4 bg-background/50">
                              {/* Same content structure */}
                              <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium text-medical-blue">
                                      {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                                      {new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                      })}
                                    </span>
                                    <Badge className={getStatusColor(appointment.status)}>
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Type: {appointment.type === 'video' ? 'Video Call' : 
                                          appointment.type === 'phone' ? 'Phone Call' : 'In-Person'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-card shadow-card">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a patient to view their details and appointment history</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorPatients;