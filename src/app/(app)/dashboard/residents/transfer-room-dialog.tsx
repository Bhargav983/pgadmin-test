
"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Room } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

interface TransferRoomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newRoomId: string) => void;
  residentName: string;
  currentRoomId: string | null;
  availableRooms: Room[];
}

export function TransferRoomDialog({
  isOpen,
  onClose,
  onSubmit,
  residentName,
  currentRoomId,
  availableRooms,
}: TransferRoomDialogProps) {
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string | undefined>(undefined);
  const { toast } = useToast();

  const currentRoomDetails = availableRooms.find(r => r.id === currentRoomId) ?? 
                             (currentRoomId ? { roomNumber: "Unknown", capacity: 0, currentOccupancy: 0 } : null);


  const handleSubmit = () => {
    if (!selectedNewRoomId) {
      toast({
        title: "No Room Selected",
        description: "Please select a new room to transfer the resident.",
        variant: "destructive",
      });
      return;
    }
    onSubmit(selectedNewRoomId);
  };

  // Filter out the current room from selection and rooms that are full
  const eligibleRooms = availableRooms.filter(room => {
    // Exclude current room from list of new rooms
    if (room.id === currentRoomId) return false; 
    // Exclude rooms that are full
    return room.currentOccupancy < room.capacity;
  });


  React.useEffect(() => {
    if (isOpen) {
      setSelectedNewRoomId(undefined); // Reset selection when dialog opens
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline">Transfer Resident: {residentName}</DialogTitle>
          <DialogDescription>
            Current Room: {currentRoomDetails?.roomNumber || "Unassigned"}. Select a new room for this resident.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="newRoom">New Room</Label>
            <Select onValueChange={setSelectedNewRoomId} value={selectedNewRoomId}>
              <SelectTrigger id="newRoom">
                <SelectValue placeholder="Select a new room" />
              </SelectTrigger>
              <SelectContent>
                {eligibleRooms.length > 0 ? (
                  eligibleRooms.map((room) => (
                    <SelectItem
                      key={room.id}
                      value={room.id}
                      disabled={room.currentOccupancy >= room.capacity}
                    >
                      {room.roomNumber} (Occupancy: {room.currentOccupancy}/{room.capacity})
                      {room.currentOccupancy >= room.capacity ? " - Full" : ""}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">No available rooms for transfer.</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!selectedNewRoomId || eligibleRooms.length === 0} className="bg-accent text-accent-foreground hover:bg-accent/90">
            Transfer Resident
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
