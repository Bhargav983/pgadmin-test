
"use client";

import type { Room, Resident } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Users, BedDouble, IndianRupee, Layers, Sparkles, User, PlusSquare } from "lucide-react";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RoomCardProps {
  room: Room;
  residents: Resident[]; // All residents to filter occupants from
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
}

export function RoomCard({ room, residents, onEdit, onDelete }: RoomCardProps) {
  const router = useRouter();
  const occupancyRate = room.capacity > 0 ? (room.currentOccupancy / room.capacity) * 100 : 0;
  let occupancyBadgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let occupancyText = `${Math.round(occupancyRate)}% Full`;
  let badgeClassName = "bg-primary text-primary-foreground";

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

  const occupants = residents.filter(
    (res) => res.roomId === room.id && (res.status === 'active' || res.status === 'upcoming')
  );

  const handleAddResidentToRoom = () => {
    router.push(`/dashboard/residents/add?roomId=${room.id}&floorNumber=${room.floorNumber}`);
  };

  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden">
      <CardHeader className="pb-2">
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
              <DropdownMenuItem onClick={() => onEdit(room)} className="cursor-pointer">
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(room.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="pt-1">
          <Badge variant={occupancyBadgeVariant} className={badgeClassName}>
            {occupancyText}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm pt-2 pb-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Beds:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Array.from({ length: room.capacity }).map((_, index) => {
              const occupant = occupants[index];
              if (occupant) {
                return (
                  <Button
                    key={`bed-${room.id}-${index}-occupied`}
                    variant="outline"
                    size="sm"
                    className="h-auto py-1.5 px-2.5 text-left truncate border-primary bg-primary/10 hover:bg-primary/20 text-primary-foreground"
                    asChild
                  >
                    <Link href={`/dashboard/residents/${occupant.id}`} title={`View ${occupant.name}`}>
                      <User className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                      <span className="truncate text-xs">{occupant.name}</span>
                    </Link>
                  </Button>
                );
              } else {
                return (
                  <Button
                    key={`bed-${room.id}-${index}-empty`}
                    variant="outline"
                    size="sm"
                    className="h-auto py-1.5 px-2.5 text-left truncate border-dashed hover:border-accent hover:bg-accent/10 text-muted-foreground"
                    onClick={handleAddResidentToRoom}
                    title="Add Resident to this Slot"
                  >
                    <PlusSquare className="mr-1.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                    <span className="truncate text-xs">Vacant Slot</span>
                  </Button>
                );
              }
            })}
          </div>
        </div>

        <div className="pt-2 space-y-1">
          <div className="flex items-center text-muted-foreground">
            <Layers className="mr-2 h-4 w-4 text-primary" /> Floor: <span className="font-medium text-foreground ml-1">{room.floorNumber === 0 ? "Ground" : room.floorNumber}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <IndianRupee className="mr-2 h-4 w-4 text-primary" /> Rent: <span className="font-medium text-foreground ml-1">₹{room.rent.toLocaleString()}</span>
          </div>
          {room.facilities && room.facilities.length > 0 && (
            <div className="flex items-start text-muted-foreground pt-1">
              <Sparkles className="mr-2 h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {room.facilities.map((facility, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">{facility}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
