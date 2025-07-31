import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Heart, Clock, Plus, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

interface AvailabilitySlot {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const DoctorAvailability = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchAvailability = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('doctor_availability')
        .select('*')
        .eq('doctor_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAvailability(data || []);
      setAvailabilityLoading(false);
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast({
        title: "Error",
        description: "Failed to load availability settings.",
        variant: "destructive",
      });
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [user]);

  const addTimeSlot = (dayOfWeek: number) => {
    const newSlot: AvailabilitySlot = {
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    };
    setAvailability([...availability, newSlot]);
  };

  const updateTimeSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const updated = [...availability];
    updated[index] = { ...updated[index], [field]: value };
    setAvailability(updated);
  };

  const removeTimeSlot = async (index: number) => {
    const slot = availability[index];
    
    // If slot has an ID, delete from database
    if (slot.id) {
      try {
        const { error } = await supabase
          .from('doctor_availability')
          .delete()
          .eq('id', slot.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Time slot removed successfully.",
        });
      } catch (error) {
        console.error('Error removing time slot:', error);
        toast({
          title: "Error",
          description: "Failed to remove time slot.",
          variant: "destructive",
        });
        return;
      }
    }

    // Remove from local state
    const updated = availability.filter((_, i) => i !== index);
    setAvailability(updated);
  };

  const saveAvailability = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Separate new slots from existing ones
      const newSlots = availability.filter(slot => !slot.id);
      const existingSlots = availability.filter(slot => slot.id);

      // Insert new slots
      if (newSlots.length > 0) {
        const slotsToInsert = newSlots.map(slot => ({
          doctor_id: user.id,
          day_of_week: slot.day_of_week,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_available: slot.is_available
        }));

        const { error: insertError } = await supabase
          .from('doctor_availability')
          .insert(slotsToInsert);

        if (insertError) throw insertError;
      }

      // Update existing slots
      for (const slot of existingSlots) {
        const { error: updateError } = await supabase
          .from('doctor_availability')
          .update({
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_available: slot.is_available
          })
          .eq('id', slot.id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Success",
        description: "Availability settings saved successfully.",
      });

      // Refresh data
      fetchAvailability();
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.filter(slot => slot.day_of_week === dayOfWeek);
  };

  if (loading || availabilityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="h-8 w-8 text-blue-400 animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading availability settings...</p>
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
              <h1 className="text-2xl font-bold text-foreground">Set Availability</h1>
            </div>
            <Button 
              onClick={saveAvailability} 
              disabled={saving}
              className="bg-medical-blue hover:bg-medical-blue/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Manage Your Availability</h2>
            <p className="text-lg text-muted-foreground">
              Set your available time slots for each day of the week
            </p>
          </div>

          <div className="grid gap-6">
            {daysOfWeek.map((day) => {
              const daySlots = getAvailabilityForDay(day.value);
              
              return (
                <Card key={day.value} className="bg-gradient-card shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        {day.label}
                        {daySlots.length > 0 && (
                          <Badge variant="secondary">
                            {daySlots.filter(slot => slot.is_available).length} slots
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day.value)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Slot
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {daySlots.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No availability set for this day. Click "Add Slot" to get started.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {daySlots.map((slot, slotIndex) => {
                          const globalIndex = availability.indexOf(slot);
                          return (
                            <div key={slotIndex} className="border rounded-lg p-4 bg-background/50">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                  <Label htmlFor={`start-${globalIndex}`}>Start Time</Label>
                                  <Input
                                    id={`start-${globalIndex}`}
                                    type="time"
                                    value={slot.start_time}
                                    onChange={(e) => updateTimeSlot(globalIndex, 'start_time', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`end-${globalIndex}`}>End Time</Label>
                                  <Input
                                    id={`end-${globalIndex}`}
                                    type="time"
                                    value={slot.end_time}
                                    onChange={(e) => updateTimeSlot(globalIndex, 'end_time', e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id={`available-${globalIndex}`}
                                    checked={slot.is_available}
                                    onCheckedChange={(checked) => updateTimeSlot(globalIndex, 'is_available', checked)}
                                  />
                                  <Label htmlFor={`available-${globalIndex}`}>
                                    {slot.is_available ? 'Available' : 'Unavailable'}
                                  </Label>
                                </div>
                                <div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeTimeSlot(globalIndex)}
                                    className="border-red-300 text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Setup Templates */}
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Setup Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    const weekdaySlots: AvailabilitySlot[] = [];
                    for (let day = 1; day <= 5; day++) {
                      weekdaySlots.push({
                        day_of_week: day,
                        start_time: '09:00',
                        end_time: '17:00',
                        is_available: true
                      });
                    }
                    setAvailability([...availability, ...weekdaySlots]);
                  }}
                >
                  Standard Weekdays
                  <br />
                  <span className="text-xs text-muted-foreground">Mon-Fri 9AM-5PM</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const extendedSlots: AvailabilitySlot[] = [];
                    for (let day = 1; day <= 6; day++) {
                      extendedSlots.push({
                        day_of_week: day,
                        start_time: '08:00',
                        end_time: '18:00',
                        is_available: true
                      });
                    }
                    setAvailability([...availability, ...extendedSlots]);
                  }}
                >
                  Extended Hours
                  <br />
                  <span className="text-xs text-muted-foreground">Mon-Sat 8AM-6PM</span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setAvailability([]);
                  }}
                >
                  Clear All
                  <br />
                  <span className="text-xs text-muted-foreground">Start fresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DoctorAvailability;