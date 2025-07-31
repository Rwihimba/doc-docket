import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PatientHeader } from "@/components/PatientHeader";
import { DoctorSearchFilters } from "@/components/DoctorSearchFilters";
import { DoctorCard } from "@/components/DoctorCard";
import { DoctorProfileModal } from "@/components/DoctorProfileModal";
import { UpcomingAppointments } from "@/components/UpcomingAppointments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PatientDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    thisMonth: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointmentsKey, setAppointmentsKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchAppointmentStats = async () => {
    if (!user) return;
    
    try {
      // Get total appointments
      const { count: totalCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id);

      // Get this month's appointments
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: monthCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', user.id)
        .gte('appointment_date', startOfMonth.toISOString().split('T')[0]);

      setAppointmentStats({
        total: totalCount || 0,
        thisMonth: monthCount || 0
      });
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAppointmentStats();
    }
  }, [user]);

  const fetchDoctors = async () => {
    try {
      // Get doctors data
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*');

      if (doctorsError) {
        console.error('Error fetching doctors:', doctorsError);
        setDoctors([]);
        return;
      }

      // Get all profiles for the doctors
      const doctorIds = doctorsData?.map(doctor => doctor.user_id) || [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', doctorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>) || {};

      const formattedDoctors = doctorsData?.map((doctor) => {
        const profile = profilesMap[doctor.user_id];
        const doctorName = profile?.display_name || 'Dr. Professional';
        
        return {
          id: doctor.id, // This is the correct doctor table ID
          user_id: doctor.user_id, // Keep user_id for reference
          name: doctorName,
          specialty: doctor.specialty,
          rating: doctor.rating || 4.5,
          reviewCount: 0, // Will be populated from real review data later
          experience: doctor.years_experience ? `${doctor.years_experience} years experience` : 'Experienced',
          location: doctor.location || 'Medical Center',
          nextAvailable: 'Available',
          consultationFee: doctor.consultation_fee || 10,
          avatar: doctor.avatar_url || `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=150&h=150`,
          isAvailableToday: true,
          offersVideoConsult: true
        };
      }) || [];
      
      setDoctors(formattedDoctors);
      setFilteredDoctors(formattedDoctors);
    } catch (error) {
      console.error('Error:', error);
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = doctors;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply specialty filter
    if (selectedSpecialty && selectedSpecialty !== "All Specialties") {
      filtered = filtered.filter(doctor =>
        doctor.specialty === selectedSpecialty
      );
    }

    // Apply availability filter (currently just for UI, can be expanded)
    if (selectedAvailability && selectedAvailability !== "Any Time") {
      // This can be expanded to filter by actual availability
      filtered = filtered.filter(doctor => doctor.isAvailableToday);
    }

    setFilteredDoctors(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedSpecialty, selectedAvailability, doctors]);

  const handleBookAppointment = (doctor: any) => {
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
  };

  const handleConfirmBooking = async (doctorId: string, date: Date, time: string, type: 'in-person' | 'video') => {
    if (!user) return;

    try {
       // Find the doctor by the selected doctor object to get user_id
       const doctorToBook = doctors.find(d => d.id === doctorId);
       
       if (!doctorToBook) {
         toast({
           title: "Doctor Not Found",
           description: "Unable to find the selected doctor. Please try again.",
           variant: "destructive",
         });
         return;
       }
       
       const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user.id,
          doctor_id: doctorToBook.user_id, // Use user_id instead of id
          appointment_date: date.toISOString().split('T')[0],
          appointment_time: time,
          type: type,
          status: 'pending',
          location: type === 'video' ? 'Video Call' : (doctorToBook?.location || selectedDoctor?.location)
        })
        .select()
        .single();

      if (error) {
        console.error('Error booking appointment:', error);
        toast({
          title: "Booking Failed",
          description: "There was an error booking your appointment. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Appointment Booked!",
        description: `Your appointment with ${selectedDoctor?.name} has been confirmed for ${date.toLocaleDateString()} at ${time}.`,
      });

      // Navigate to confirmation page
      navigate(`/appointment/${data.id}`);
      
      setIsModalOpen(false);
      setSelectedDoctor(null);
      
      // Refresh appointments
      setAppointmentsKey(prev => prev + 1);
      fetchAppointmentStats();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Booking Failed",
        description: "There was an error booking your appointment. Please try again.",
        variant: "destructive",
      });
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
        <DoctorSearchFilters 
          onSearch={setSearchQuery}
          onSpecialtyChange={setSelectedSpecialty}
          onAvailabilityChange={setSelectedAvailability}
        />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Doctors Grid */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Available Doctors</h2>
              <span className="text-sm text-muted-foreground">
                {doctorsLoading ? 'Loading...' : `${filteredDoctors.length} doctors found`}
              </span>
            </div>
            
            <div className="space-y-4">
              {doctorsLoading ? (
                <div className="text-center py-8">
                  <Heart className="h-8 w-8 text-blue-400 animate-pulse mx-auto mb-2" />
                  <p className="text-muted-foreground">Loading doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {doctors.length === 0 ? "No doctors found. Try registering as a doctor!" : "No doctors match your filters. Try adjusting your search criteria."}
                  </p>
                </div>
              ) : (
                filteredDoctors.map((doctor) => (
                  <DoctorCard 
                    key={doctor.id} 
                    doctor={doctor} 
                    onBookAppointment={handleBookAppointment}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 appointments-section">
            <UpcomingAppointments key={appointmentsKey} />
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-card p-4 rounded-lg shadow-card text-center">
                <div className="text-2xl font-bold text-medical-blue">{appointmentStats.total}</div>
                <div className="text-sm text-muted-foreground">Total Appointments</div>
              </div>
              <div className="bg-gradient-card p-4 rounded-lg shadow-card text-center">
                <div className="text-2xl font-bold text-medical-teal">{appointmentStats.thisMonth}</div>
                <div className="text-sm text-muted-foreground">This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Profile Modal */}
        <DoctorProfileModal
          doctor={selectedDoctor}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDoctor(null);
          }}
          onBookAppointment={handleConfirmBooking}
        />
      </main>
    </div>
  );
};

export default PatientDashboard;