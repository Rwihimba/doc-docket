import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PatientHeader } from "@/components/PatientHeader";
import { DoctorSearchFilters } from "@/components/DoctorSearchFilters";
import { DoctorCard } from "@/components/DoctorCard";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

const PatientDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      // First get doctors data
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*');

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
        setDoctors([]);
        return;
      }

      // Then get profiles for each doctor
      const doctorsWithProfiles = await Promise.all(
        doctorsData?.map(async (doctor) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('user_id', doctor.user_id)
            .maybeSingle();

          return {
            id: doctor.id,
            name: profile?.display_name || 'Dr. Professional',
            specialty: doctor.specialty,
            rating: doctor.rating || 4.5,
            reviewCount: Math.floor(Math.random() * 200) + 50, // Random for now
            experience: doctor.years_experience ? `${doctor.years_experience} years experience` : 'Experienced',
            location: doctor.location || 'Medical Center',
            nextAvailable: 'Available',
            consultationFee: 10, // Set to $10 as requested
            avatar: doctor.avatar_url || `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=150&h=150`,
            isAvailableToday: true,
            offersVideoConsult: true
          };
        }) || []
      );
      
      setDoctors(doctorsWithProfiles);
    } catch (error) {
      console.error('Error:', error);
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="h-8 w-8 text-blue-400 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PatientHeader />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Find Your Perfect Doctor
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Book appointments with trusted healthcare professionals. Quality care, convenient scheduling.
          </p>
        </div>

        {/* Search and Filters */}
        <DoctorSearchFilters />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctors Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Available Doctors</h2>
              <span className="text-sm text-muted-foreground">
                {doctorsLoading ? 'Loading...' : `${doctors.length} doctors found`}
              </span>
            </div>
            
            <div className="space-y-4">
              {doctorsLoading ? (
                <div className="text-center py-8">
                  <Heart className="h-8 w-8 text-blue-400 animate-pulse mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading doctors...</p>
                </div>
              ) : doctors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No doctors found. Try registering as a doctor!</p>
                </div>
              ) : (
                doctors.map((doctor) => (
                  <DoctorCard key={doctor.id} doctor={doctor} />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UpcomingAppointments />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-card p-4 rounded-lg shadow-card text-center">
                <div className="text-2xl font-bold text-medical-blue">8</div>
                <div className="text-sm text-muted-foreground">Total Appointments</div>
              </div>
              <div className="bg-gradient-card p-4 rounded-lg shadow-card text-center">
                <div className="text-2xl font-bold text-medical-teal">3</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;