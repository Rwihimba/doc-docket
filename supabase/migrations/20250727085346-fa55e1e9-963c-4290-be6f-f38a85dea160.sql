-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(user_id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in-person', 'video', 'phone')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')),
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view their own appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = patient_id);

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view their appointments"
ON public.appointments
FOR SELECT
USING (auth.uid() = doctor_id);

-- Patients can create their own appointments
CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own appointments
CREATE POLICY "Patients can update their appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = patient_id);

-- Doctors can update appointments assigned to them
CREATE POLICY "Doctors can update their appointments"
ON public.appointments
FOR UPDATE
USING (auth.uid() = doctor_id);

-- Add trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();