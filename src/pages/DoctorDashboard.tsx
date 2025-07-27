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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
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

    if (user) {
      fetchDoctorProfile();
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
    { title: "Today's Appointments", value: "8", icon: Calendar, trend: "+2 from yesterday" },
    { title: "Total Patients", value: "156", icon: Users, trend: "+12 this month" },
    { title: "Avg Consultation", value: "25 min", icon: Clock, trend: "2 min faster" },
    { title: "Rating", value: "4.8", icon: TrendingUp, trend: "+0.2 this month" },
  ];

  const upcomingAppointments = [
    { time: "09:00", patient: "John Smith", type: "Consultation", status: "confirmed" },
    { time: "10:30", patient: "Sarah Johnson", type: "Follow-up", status: "confirmed" },
    { time: "14:00", patient: "Mike Wilson", type: "Consultation", status: "pending" },
    { time: "15:30", patient: "Emily Davis", type: "Check-up", status: "confirmed" },
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
                  {upcomingAppointments.map((appointment, index) => (
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
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Add Appointment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View Patients
                </Button>
                <Button variant="outline" className="w-full justify-start">
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