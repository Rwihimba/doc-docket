import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Calendar, Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const DoctorDashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [doctorStats, setDoctorStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    avgRating: 0
  });
  const [todayAppointments, setTodayAppointments] = useState<any[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchDoctorProfile = async () => {
    if (user) {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching doctor profile:', error);
      } else {
        setDoctorProfile(data);
      }
      setProfileLoading(false);
    }
  };

  const fetchDoctorStats = async () => {
    if (!user) return;
    
    try {
      // Get today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount, data: todayData } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('doctor_id', user.id)
        .eq('appointment_date', today)
        .order('appointment_time', { ascending: true });

      // Get patient profiles for today's appointments
      const patientIds = todayData?.map(appointment => appointment.patient_id) || [];
      const { data: patientProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', patientIds);

      const profilesMap = patientProfiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Get total unique patients
      const { data: allAppointments } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', user.id);
      
      const uniquePatients = new Set(allAppointments?.map(a => a.patient_id) || []).size;

      // Get doctor rating
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('rating')
        .eq('user_id', user.id)
        .single();

      setDoctorStats({
        todayAppointments: todayCount || 0,
        totalPatients: uniquePatients,
        avgRating: doctorData?.rating || 0
      });

      // Format today's appointments
      const formattedTodayAppointments = todayData?.map(appointment => {
        const patientProfile = profilesMap[appointment.patient_id];
        return {
          time: new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false
          }),
          patient: patientProfile?.display_name || 'Unknown Patient',
          type: appointment.type === 'video' ? 'Video Call' : 
                appointment.type === 'phone' ? 'Phone Call' : 'In-Person',
          status: appointment.status
        };
      }) || [];

      setTodayAppointments(formattedTodayAppointments);
    } catch (error) {
      console.error('Error fetching doctor stats:', error);
    }
  };

  const fetchPendingAppointments = async () => {
    if (!user) return;
    
    try {
      // Get pending appointments
      const { data: pendingData } = await supabase
        .from('appointments')
        .select('*, doctors!appointments_doctor_id_fkey(specialty, avatar_url, user_id)')
        .eq('doctor_id', user.id)
        .eq('status', 'pending')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Get patient profiles for pending appointments
      const patientIds = pendingData?.map(appointment => appointment.patient_id) || [];
      const { data: patientProfiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', patientIds);

      const profilesMap = patientProfiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      // Format pending appointments
      const formattedPendingAppointments = pendingData?.map(appointment => {
        const patientProfile = profilesMap[appointment.patient_id];
        return {
          id: appointment.id,
          date: new Date(appointment.appointment_date).toLocaleDateString(),
          time: new Date(`2000-01-01T${appointment.appointment_time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          patient: patientProfile?.display_name || 'Unknown Patient',
          patientEmail: patientProfile?.email || '',
          type: appointment.type === 'video' ? 'Video Call' : 
                appointment.type === 'phone' ? 'Phone Call' : 'In-Person',
          location: appointment.location,
          notes: appointment.notes,
          status: appointment.status
        };
      }) || [];

      setPendingAppointments(formattedPendingAppointments);
    } catch (error) {
      console.error('Error fetching pending appointments:', error);
    }
  };

  const handleApproveAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh pending appointments
      fetchPendingAppointments();
      fetchDoctorStats();
    } catch (error) {
      console.error('Error approving appointment:', error);
    }
  };

  const handleRejectAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      // Refresh pending appointments
      fetchPendingAppointments();
      fetchDoctorStats();
    } catch (error) {
      console.error('Error rejecting appointment:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDoctorProfile();
      fetchDoctorStats();
      fetchPendingAppointments();
    }
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="h-8 w-8 text-blue-400 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = [
    { title: "Today's Appointments", value: doctorStats.todayAppointments.toString(), icon: Calendar, trend: "Live data" },
    { title: "Total Patients", value: doctorStats.totalPatients.toString(), icon: Users, trend: "All time" },
    { title: "Avg Consultation", value: "25 min", icon: Clock, trend: "Estimated" },
    { title: "Rating", value: doctorStats.avgRating.toFixed(1), icon: TrendingUp, trend: "Current rating" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8 text-blue-400" />
              <h1 className="text-2xl font-bold text-foreground">Doctrizer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Welcome, Dr. {doctorProfile?.specialty || 'Doctor'}
              </span>
              <Avatar>
                <AvatarImage src={doctorProfile?.avatar_url} />
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Good morning, Dr. {user.user_metadata?.display_name || 'Doctor'}!
          </h2>
          <p className="text-lg text-muted-foreground">
            Here's an overview of your practice today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gradient-card shadow-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Appointments - Priority Section */}
        {pendingAppointments.length > 0 && (
          <Card className="bg-gradient-card shadow-card border-amber-200">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Appointments - Requires Approval
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  {pendingAppointments.length}
                </Badge>
              </CardTitle>
              <CardDescription>Review and approve patient appointment requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingAppointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-4 bg-background/50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="font-semibold text-foreground">{appointment.patient}</div>
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.patientEmail}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-medium text-medical-blue">{appointment.date} at {appointment.time}</span>
                          <span className="text-muted-foreground">{appointment.type}</span>
                          {appointment.location && (
                            <span className="text-muted-foreground">Location: {appointment.location}</span>
                          )}
                        </div>
                        {appointment.notes && (
                          <div className="text-sm text-muted-foreground">
                            <strong>Notes:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveAppointment(appointment.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectAppointment(appointment.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Today's Schedule</CardTitle>
                <CardDescription>Your upcoming appointments for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayAppointments.map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium text-medical-blue">
                          {appointment.time}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{appointment.patient}</div>
                          <div className="text-sm text-muted-foreground">{appointment.type}</div>
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-6">
                  <Button className="w-full">View Full Schedule</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile & Quick Actions */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Your Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto">
                    <AvatarImage src={doctorProfile?.avatar_url} />
                    <AvatarFallback className="text-lg">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-foreground mt-2">
                    Dr. {user.user_metadata?.display_name || 'Doctor'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {doctorProfile?.specialty || 'General Practice'}
                  </p>
                  {doctorProfile?.location && (
                    <p className="text-xs text-muted-foreground">
                      {doctorProfile.location}
                    </p>
                  )}
                </div>
                <Button variant="outline" className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/doctor-patients')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Patients
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/doctor-availability')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Set Availability
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DoctorDashboard;