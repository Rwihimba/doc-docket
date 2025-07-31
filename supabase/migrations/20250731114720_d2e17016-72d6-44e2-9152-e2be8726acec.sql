-- Create doctor_availability table for managing doctor schedules
CREATE TABLE public.doctor_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, day_of_week, start_time)
);

-- Enable Row Level Security
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

-- Create policies for doctor_availability
CREATE POLICY "Doctors can view their own availability" 
ON public.doctor_availability 
FOR SELECT 
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert their own availability" 
ON public.doctor_availability 
FOR INSERT 
WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update their own availability" 
ON public.doctor_availability 
FOR UPDATE 
USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete their own availability" 
ON public.doctor_availability 
FOR DELETE 
USING (auth.uid() = doctor_id);

-- Anyone can view doctor availability for booking appointments
CREATE POLICY "Anyone can view doctor availability for booking" 
ON public.doctor_availability 
FOR SELECT 
USING (is_available = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_doctor_availability_updated_at
BEFORE UPDATE ON public.doctor_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();