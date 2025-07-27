import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PatientHeader } from "@/components/PatientHeader";
import { DoctorSearchFilters } from "@/components/DoctorSearchFilters";
import { DoctorCard } from "@/components/DoctorCard";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { mockDoctors } from "@/data/mockDoctors";
import { useAuth } from "@/hooks/useAuth";
import { Heart } from "lucide-react";

const PatientDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
                {mockDoctors.length} doctors found
              </span>
            </div>
            
            <div className="space-y-4">
              {mockDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
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