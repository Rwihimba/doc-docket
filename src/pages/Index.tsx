import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchUserRole();
    }
  }, [user, loading, navigate]);

  const fetchUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        // Fallback to user metadata if profile doesn't exist yet
        const role = user.user_metadata?.role || 'patient';
        setUserRole(role);
      } else {
        setUserRole(data.role);
      }
    } catch (error) {
      console.error('Error:', error);
      // Fallback to user metadata
      const role = user.user_metadata?.role || 'patient';
      setUserRole(role);
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading || roleLoading) {
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Heart className="h-8 w-8 text-blue-400 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Welcome to Doctrizer</h1>
          <p className="text-muted-foreground">Please sign in to continue</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  if (userRole === 'doctor') {
    return <DoctorDashboard />;
  } else {
    return <PatientDashboard />;
  }
};

export default Index;
