import { Calendar, Clock, MapPin, Star, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    reviewCount: number;
    experience: string;
    location: string;
    nextAvailable: string;
    consultationFee: number;
    avatar: string;
    isAvailableToday: boolean;
    offersVideoConsult: boolean;
  };
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-hover transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Doctor Avatar */}
          <Avatar className="h-16 w-16 ring-2 ring-medical-blue/20">
            <AvatarImage src={doctor.avatar} alt={doctor.name} />
            <AvatarFallback className="bg-medical-blue text-white text-lg font-semibold">
              {doctor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>

          {/* Doctor Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-medical-blue transition-colors">
                  Dr. {doctor.name}
                </h3>
                <p className="text-medical-teal font-medium">{doctor.specialty}</p>
                <p className="text-sm text-muted-foreground">{doctor.experience}</p>
              </div>
              
              <div className="flex flex-col items-end space-y-1">
                {doctor.isAvailableToday && (
                  <Badge className="bg-medical-success/20 text-medical-success border-medical-success/30">
                    Available Today
                  </Badge>
                )}
                {doctor.offersVideoConsult && (
                  <Badge variant="outline" className="border-medical-info/30 text-medical-info">
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                )}
              </div>
            </div>

            {/* Rating and Reviews */}
            <div className="flex items-center space-x-2 mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-medical-warning text-medical-warning" />
                <span className="ml-1 text-sm font-medium text-foreground">{doctor.rating}</span>
              </div>
              <span className="text-sm text-muted-foreground">({doctor.reviewCount} reviews)</span>
            </div>

            {/* Location and Availability */}
            <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {doctor.location}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Next: {doctor.nextAvailable}
              </div>
            </div>

            {/* Fee and Action */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-lg font-semibold text-foreground">
                ${doctor.consultationFee}
                <span className="text-sm text-muted-foreground font-normal ml-1">consultation</span>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="border-medical-blue/30 text-medical-blue hover:bg-medical-blue/10">
                  View Profile
                </Button>
                <Button size="sm" className="bg-medical-blue hover:bg-medical-blue/90">
                  <Calendar className="w-4 h-4 mr-1" />
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}