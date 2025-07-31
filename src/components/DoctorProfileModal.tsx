import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, Star, Video, Phone, Calendar as CalendarIcon, User } from "lucide-react";
import { format, addDays, isSameDay, startOfDay, addMinutes, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: string;
  location: string;
  consultationFee: number;
  avatar: string;
  isAvailableToday: boolean;
  offersVideoConsult: boolean;
}

interface DoctorProfileModalProps {
  doctor: Doctor | null;
  isOpen: boolean;
  onClose: () => void;
  onBookAppointment: (doctorId: string, date: Date, time: string, type: 'in-person' | 'video') => void;
}

export function DoctorProfileModal({ doctor, isOpen, onClose, onBookAppointment }: DoctorProfileModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<'in-person' | 'video'>('in-person');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Generate available time slots for the next 2 weeks
  const generateTimeSlots = (date: Date) => {
    const slots: string[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = 30; // 30 minutes
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // Check if slot is in the past for today
        if (isSameDay(date, new Date())) {
          const slotDateTime = new Date(date);
          slotDateTime.setHours(hour, minute, 0, 0);
          if (isAfter(slotDateTime, new Date())) {
            slots.push(timeSlot);
          }
        } else {
          slots.push(timeSlot);
        }
      }
    }
    
    return slots;
  };

  useEffect(() => {
    if (selectedDate) {
      setAvailableSlots(generateTimeSlots(selectedDate));
      setSelectedTime(""); // Reset selected time when date changes
    }
  }, [selectedDate]);

  const handleContinueToConfirmation = () => {
    if (selectedTime && selectedDate) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedTime && selectedDate && doctor) {
      onBookAppointment(doctor.id, selectedDate, selectedTime, appointmentType);
      setShowConfirmation(false);
      onClose();
    }
  };

  const handleBackToSelection = () => {
    setShowConfirmation(false);
  };

  const nextTwoWeeks = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  // Handle null doctor case without early return
  if (!doctor) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>No Doctor Selected</DialogTitle>
          </DialogHeader>
          <p>Please select a doctor to book an appointment.</p>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Book Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 overflow-hidden">
          {/* Doctor Information */}
          <div className="space-y-6">
            <Card className="bg-gradient-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar className="h-16 w-16 ring-2 ring-medical-blue/20">
                    <AvatarImage 
                      src={doctor.avatar || 'https://cdn4.iconfinder.com/data/icons/glyphs/24/icons_user-1024.png'} 
                      alt={doctor.name} 
                    />
                    <AvatarFallback className="bg-medical-blue text-white text-lg font-semibold">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{doctor.name}</h3>
                    <p className="text-medical-blue font-medium">{doctor.specialty}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm font-medium">{doctor.rating}</span>
                        <span className="ml-1 text-sm text-muted-foreground">({doctor.reviewCount} reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    {doctor.experience}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {doctor.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Consultation Fee:</span>
                    <span className="text-lg font-bold text-medical-blue">${doctor.consultationFee}</span>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Available Services</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      In-Person Consultation
                    </Badge>
                    {doctor.offersVideoConsult && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Video className="h-3 w-3" />
                        Video Consultation
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Booking Section */}
          <div className="space-y-6">
            {!showConfirmation ? (
              <>
                {/* Appointment Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Select Appointment Type
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        variant={appointmentType === 'in-person' ? 'default' : 'outline'}
                        onClick={() => setAppointmentType('in-person')}
                        className="justify-start"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        In-Person Consultation - ${doctor.consultationFee}
                      </Button>
                      {doctor.offersVideoConsult && (
                        <Button
                          variant={appointmentType === 'video' ? 'default' : 'outline'}
                          onClick={() => setAppointmentType('video')}
                          className="justify-start"
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Video Consultation - ${doctor.consultationFee - 5}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Date Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      disabled={(date) => 
                        date < startOfDay(new Date()) || 
                        date > addDays(new Date(), 13)
                      }
                      className={cn("w-full pointer-events-auto")}
                    />
                  </CardContent>
                </Card>
                
                {/* Time Selection */}
                {selectedDate && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Available Times - {format(selectedDate, 'MMM dd, yyyy')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-32">
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                              className="text-xs"
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                        {availableSlots.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No available slots for this date. Please select another date.
                          </p>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
                
                {/* Continue Button - Only show when both date and time are selected */}
                {selectedDate && selectedTime && (
                  <div className="flex gap-3">
                    <Button
                      onClick={handleContinueToConfirmation}
                      className="flex-1 bg-medical-blue hover:bg-medical-blue/90"
                    >
                      Continue to Confirmation
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Confirmation Step */
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    Confirm Your Appointment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Doctor:</span>
                      <span>{doctor.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Specialty:</span>
                      <span>{doctor.specialty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Date:</span>
                      <span>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Time:</span>
                      <span>{selectedTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Type:</span>
                      <span className="flex items-center gap-1">
                        {appointmentType === 'video' ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                        {appointmentType === 'video' ? 'Video Consultation' : 'In-Person Consultation'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Fee:</span>
                      <span className="text-lg font-bold text-medical-blue">
                        ${appointmentType === 'video' ? doctor.consultationFee - 5 : doctor.consultationFee}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleConfirmBooking}
                      className="flex-1 bg-medical-success hover:bg-medical-success/90"
                    >
                      Confirm & Book Appointment
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleBackToSelection}
                      className="flex-1"
                    >
                      Back to Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}