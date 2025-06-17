
"use client";

import type { Room } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, BedDouble, DollarSign } from "lucide-react";

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

  if (room.currentOccupancy === 0) {
    occupancyBadgeVariant = "secondary"; 
    occupancyText = "Vacant";
    badgeClassName = "bg-green-500 text-white";
  } else if (room.capacity > 0 && room.currentOccupancy === room.capacity) {
    occupancyBadgeVariant = "destructive";
    occupancyText = "Full";
    badgeClassName = "bg-destructive text-destructive-foreground";
  } else if (room.currentOccupancy > 0) {
    // Already set by default: occupancyBadgeVariant = "default"; badgeClassName is primary
    occupancyText = `${Math.round(occupancyRate)}% Full (${room.currentOccupancy}/${room.capacity})`;
  } else if (room.capacity === 0 && room.currentOccupancy === 0) {
    // Edge case: 0 capacity room that is also vacant
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
          <BedDouble className="mr-2 h-4 w-4 text-primary" /> Capacity: <span className="font-medium text-foreground ml-1">{room.capacity} persons</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Users className="mr-2 h-4 w-4 text-primary" /> Occupancy: <span className="font-medium text-foreground ml-1">{room.currentOccupancy} / {room.capacity}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <DollarSign className="mr-2 h-4 w-4 text-primary" /> Rent: <span className="font-medium text-foreground ml-1">₹{room.rent.toLocaleString()}</span>
        </div>
      </CardContent>
      {/* Footer can be used for quick actions or additional summary if needed in future */}
      {/* <CardFooter className="pt-2 pb-4">
      </CardFooter> */}
    </Card>
  );
}
