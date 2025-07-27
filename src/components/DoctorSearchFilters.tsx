import { useState } from "react";
import { Search, MapPin, Filter, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export function DoctorSearchFilters() {
  const [searchQuery, setSearchQuery] = useState("");

  const specialties = [
    "All Specialties",
    "Cardiology",
    "Dermatology", 
    "Neurology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "General Medicine",
    "Endocrinology"
  ];

  const locations = [
    "All Locations",
    "Downtown Medical Center",
    "Northside Clinic",
    "Westside Hospital",
    "Eastside Medical Plaza",
    "Central Health Campus"
  ];

  const availability = [
    "Any Time",
    "Today",
    "Tomorrow", 
    "This Week",
    "Next Week",
    "Next 30 Days"
  ];

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search doctors by name, specialty, or condition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-background border-border focus:border-medical-blue"
          />
        </div>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Specialty</label>
            <Select>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select specialty" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((specialty) => (
                  <SelectItem key={specialty} value={specialty.toLowerCase().replace(/\s+/g, '-')}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              <MapPin className="inline h-4 w-4 mr-1" />
              Location
            </label>
            <Select>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location} value={location.toLowerCase().replace(/\s+/g, '-')}>
                    {location}
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
            <Select>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                {availability.map((option) => (
                  <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button className="w-full h-10 bg-medical-blue hover:bg-medical-blue/90">
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}