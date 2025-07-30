import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, MapPin, User, Video, Phone, CheckCircle, ArrowLeft, Download, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface AppointmentDetails {
  id: string;
  appointment_date: string;
  appointment_time: string;
  type: string;
  status: string;
  location: string;
  notes?: string;
  doctor: {
    id: string;
    specialty: string;
    consultation_fee: number;
    avatar_url?: string;
    user_id: string;
    profile: {
      display_name: string;
      email: string;
    } | null;
  };
}

export default function AppointmentConfirmation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !appointmentId) {
      navigate('/');
      return;
    }
    
    fetchAppointmentDetails();
  }, [user, appointmentId, navigate]);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors!appointments_doctor_id_fkey (
            id,
            specialty,
            consultation_fee,
            avatar_url,
            user_id,
            profile:profiles!doctors_user_id_fkey (
              display_name,
              email
            )
          )
        `)
        .eq('id', appointmentId)
        .eq('patient_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching appointment:', error);
        navigate('/');
        return;
      }

      setAppointment(data as any);
    } catch (error) {
      console.error('Error:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = () => {
    // Navigate back to dashboard with doctor selected for rebooking
    navigate('/', { state: { rescheduleAppointment: appointment } });
  };

  const handleCancel = async () => {
    if (!appointment) return;
    
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);

      if (error) {
        console.error('Error cancelling appointment:', error);
        return;
      }

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <CheckCircle className="h-8 w-8 text-medical-blue animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Appointment not found.</p>
          <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const appointmentDate = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const doctorName = appointment.doctor.profile?.display_name || 'Dr. Professional';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-primary text-white py-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-medical-success mr-3" />
              <div>
                <h1 className="text-3xl font-bold">Appointment Confirmed!</h1>
                <p className="text-white/80">Your appointment has been successfully booked</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Appointment Details */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-medical-blue" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date & Time */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Date & Time</span>
                  <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {format(appointmentDate, 'EEEE, MMMM do, yyyy')}
                </div>
                <div className="flex items-center text-medical-blue">
                  <Clock className="h-4 w-4 mr-2" />
                  {format(appointmentDate, 'h:mm a')}
                </div>
              </div>

              <Separator />

              {/* Appointment Type */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Appointment Type</span>
                <div className="flex items-center">
                  {appointment.type === 'video' ? (
                    <Video className="h-4 w-4 mr-2 text-medical-info" />
                  ) : (
                    <Phone className="h-4 w-4 mr-2 text-medical-blue" />
                  )}
                  <span className="font-medium">
                    {appointment.type === 'video' ? 'Video Consultation' : 'In-Person Consultation'}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Location</span>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{appointment.location || 'Medical Center'}</span>
                </div>
              </div>

              {/* Fee */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">Consultation Fee</span>
                <div className="text-xl font-bold text-medical-blue">
                  ${appointment.doctor.consultation_fee}
                  {appointment.type === 'video' && (
                    <span className="text-sm text-muted-foreground ml-1">(Video discount applied)</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Information */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-medical-blue" />
                Your Doctor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16 ring-2 ring-medical-blue/20">
                  <AvatarImage 
                    src={appointment.doctor.avatar_url || 'https://cdn4.iconfinder.com/data/icons/glyphs/24/icons_user-1024.png'} 
                    alt={doctorName} 
                  />
                  <AvatarFallback className="bg-medical-blue text-white text-lg font-semibold">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">
                    {doctorName.startsWith('Dr.') ? doctorName : `Dr. ${doctorName}`}
                  </h3>
                  <p className="text-medical-blue font-medium">{appointment.doctor.specialty}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {appointment.doctor.profile?.email}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Preparation Instructions */}
              <div className="space-y-3">
                <h4 className="font-semibold text-foreground">Preparation Instructions</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {appointment.type === 'video' ? (
                    <>
                      <p>• Ensure stable internet connection</p>
                      <p>• Test your camera and microphone</p>
                      <p>• Have your medical records ready</p>
                      <p>• Find a quiet, private space</p>
                    </>
                  ) : (
                    <>
                      <p>• Arrive 15 minutes early</p>
                      <p>• Bring a valid ID and insurance card</p>
                      <p>• Bring list of current medications</p>
                      <p>• Prepare any questions for the doctor</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button 
            size="lg" 
            className="bg-medical-blue hover:bg-medical-blue/90"
            onClick={() => window.print()}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Confirmation
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleReschedule}
          >
            <Edit className="h-4 w-4 mr-2" />
            Reschedule
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={handleCancel}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Cancel Appointment
          </Button>
        </div>

        {/* Contact Information */}
        <Card className="mt-8 bg-gradient-card shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">Need Help?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">For appointment changes:</p>
                <p>Call: (555) 123-4567</p>
                <p>Email: appointments@healthcare.com</p>
              </div>
              <div>
                <p className="font-medium text-foreground">For technical support:</p>
                <p>Call: (555) 987-6543</p>
                <p>Email: support@healthcare.com</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}