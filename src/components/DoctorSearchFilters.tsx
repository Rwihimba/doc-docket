import { useState } from "react";
import { Search, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface DoctorSearchFiltersProps {
  onSearch: (query: string) => void;
  onSpecialtyChange: (specialty: string) => void;
  onAvailabilityChange: (availability: string) => void;
}

export function DoctorSearchFilters({ onSearch, onSpecialtyChange, onAvailabilityChange }: DoctorSearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");

  const specialties = [
    "All Specialties",
    "Cardiology",
    "Dermatology", 
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "General Medicine",
    "General Practice",
    "Endocrinology"
  ];

  const availability = [
    "Any Time",
    "Today",
    "Tomorrow", 
    "This Week",
    "Next Week",
    "Next 30 Days"
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleSpecialtyChange = (value: string) => {
    setSelectedSpecialty(value);
    onSpecialtyChange(value);
  };

  const handleAvailabilityChange = (value: string) => {
    setSelectedAvailability(value);
    onAvailabilityChange(value);
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search doctors by name, specialty, or condition..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 h-12 bg-background border-border focus:border-medical-blue"
          />
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Specialty</label>
            <Select onValueChange={handleSpecialtyChange} value={selectedSpecialty}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              <Clock className="inline h-4 w-4 mr-1" />
              Availability
            </label>
            <Select onValueChange={handleAvailabilityChange} value={selectedAvailability}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {availability.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedSpecialty("");
                setSelectedAvailability("");
                onSearch("");
                onSpecialtyChange("");
                onAvailabilityChange("");
              }}
              variant="outline" 
              className="w-full h-10"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}