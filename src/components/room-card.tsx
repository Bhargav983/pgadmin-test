
"use client";

import type { Room } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, BedDouble, IndianRupee, Layers, Sparkles } from "lucide-react";

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
}

export function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
  const occupancyRate = room.capacity > 0 ? (room.currentOccupancy / room.capacity) * 100 : 0;
  let occupancyBadgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let occupancyText = `${Math.round(occupancyRate)}% Full`;
  let badgeClassName = "bg-primary text-primary-foreground"; // Default for available

  if (room.currentOccupancy === 0 && room.capacity > 0) {
    occupancyBadgeVariant = "secondary"; 
    occupancyText = "Vacant";
    badgeClassName = "bg-green-500 text-white";
  } else if (room.capacity > 0 && room.currentOccupancy >= room.capacity) {
    occupancyBadgeVariant = "destructive";
    occupancyText = "Full";
    badgeClassName = "bg-destructive text-destructive-foreground";
  } else if (room.currentOccupancy > 0) {
    occupancyText = `${Math.round(occupancyRate)}% Full (${room.currentOccupancy}/${room.capacity})`;
  } else if (room.capacity === 0 && room.currentOccupancy === 0) {
    occupancyBadgeVariant = "outline";
    occupancyText = "N/A (0 Cap)";
    badgeClassName = "text-muted-foreground border-muted-foreground";
  }


  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-xl">{room.roomNumber}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Room Actions for {room.roomNumber}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(room)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(room.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
         <CardDescription className="pt-1">
          <Badge 
            variant={occupancyBadgeVariant}
            className={badgeClassName}
           >
            {occupancyText}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1.5 text-sm pt-0 pb-4">
        <div className="flex items-center text-muted-foreground">
          <Layers className="mr-2 h-4 w-4 text-primary" /> Floor: <span className="font-medium text-foreground ml-1">{room.floorNumber === 0 ? "Ground" : room.floorNumber}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <BedDouble className="mr-2 h-4 w-4 text-primary" /> Capacity: <span className="font-medium text-foreground ml-1">{room.capacity} persons</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Users className="mr-2 h-4 w-4 text-primary" /> Occupancy: <span className="font-medium text-foreground ml-1">{room.currentOccupancy} / {room.capacity}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <IndianRupee className="mr-2 h-4 w-4 text-primary" /> Rent: <span className="font-medium text-foreground ml-1">₹{room.rent.toLocaleString()}</span>
        </div>
        {room.facilities && room.facilities.length > 0 && (
          <div className="flex items-start text-muted-foreground pt-1">
            <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0 mt-0.5" /> 
            <div className="flex flex-wrap gap-1">
                {room.facilities.map((facility, index) => (
                    <Badge key={index} variant="outline" className="text-xs">{facility}</Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
