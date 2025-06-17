
"use client";

import type { Resident, Room } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, CreditCard, Repeat, UserX, UserCheck, RotateCcw, Eye, Phone, BedDouble, CalendarDays, UploadCloud, User as UserIcon } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { format } from 'date-fns';

interface ResidentCardProps {
  resident: Resident;
  rooms: Room[];
  onEdit: (residentId: string) => void;
  onDelete: (residentId: string) => void;
  onRecordPayment?: (resident: Resident) => void;
  onTransfer?: (resident: Resident) => void;
  onVacate?: (resident: Resident) => void;
  onActivate?: (resident: Resident) => void;
  onReactivate?: (resident: Resident) => void;
}

export function ResidentCard({ 
    resident, 
    rooms, 
    onEdit, 
    onDelete,
    onRecordPayment,
    onTransfer,
    onVacate,
    onActivate,
    onReactivate
}: ResidentCardProps) {
  
  const assignedRoom = resident.roomId ? rooms.find(r => r.id === resident.roomId) : null;

  let statusBadgeVariant: "default" | "secondary" | "destructive" | "outline" = "outline";
  let statusBadgeClass = "";

  switch (resident.status) {
    case 'active':
      statusBadgeVariant = "default";
      statusBadgeClass = "bg-green-500 text-white hover:bg-green-600";
      break;
    case 'upcoming':
      statusBadgeVariant = "secondary";
      statusBadgeClass = "bg-blue-500 text-white hover:bg-blue-600";
      break;
    case 'former':
      statusBadgeVariant = "destructive"; // Using destructive for former status
      statusBadgeClass = "bg-slate-500 text-white hover:bg-slate-600";
      break;
  }

  return (
    <Card className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg overflow-hidden bg-card">
      <CardHeader className="pb-2 bg-card">
        <div className="flex justify-between items-start">
          {resident.photoUrl ? (
            <Image src={resident.photoUrl} alt={resident.name} width={64} height={64} className="rounded-full border-2 border-primary object-cover aspect-square" data-ai-hint="person avatar" />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground border-2 border-primary">
              <UserIcon className="h-8 w-8" />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions for {resident.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild><Link href={`/dashboard/residents/${resident.id}`} className="flex items-center w-full cursor-pointer"><Eye className="mr-2 h-4 w-4" /> View Details</Link></DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(resident.id)} className="cursor-pointer"><Pencil className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
              
              {resident.status === 'active' && onRecordPayment && 
                <DropdownMenuItem onClick={() => onRecordPayment(resident)} disabled={!resident.roomId} className="cursor-pointer"><CreditCard className="mr-2 h-4 w-4" /> Record Payment</DropdownMenuItem>}
              {resident.status === 'active' && onTransfer && 
                <DropdownMenuItem onClick={() => onTransfer(resident)} disabled={!resident.roomId} className="cursor-pointer"><Repeat className="mr-2 h-4 w-4" /> Transfer Room</DropdownMenuItem>}
              {resident.status === 'active' && onVacate &&
                <DropdownMenuItem onClick={() => onVacate(resident)} disabled={!resident.roomId} className="text-orange-600 focus:text-orange-700 focus:bg-orange-100 cursor-pointer"><UserX className="mr-2 h-4 w-4" /> Vacate Resident</DropdownMenuItem>}
              
              {resident.status === 'upcoming' && onActivate &&
                <DropdownMenuItem onClick={() => onActivate(resident)} className="text-green-600 focus:text-green-700 focus:bg-green-100 cursor-pointer"><UserCheck className="mr-2 h-4 w-4" /> Activate Resident</DropdownMenuItem>}

              {resident.status === 'former' && onReactivate &&
                <DropdownMenuItem onClick={() => onReactivate(resident)} className="text-blue-600 focus:text-blue-700 focus:bg-blue-100 cursor-pointer"><RotateCcw className="mr-2 h-4 w-4" /> Reactivate</DropdownMenuItem>}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(resident.id)} className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer"><Trash2 className="mr-2 h-4 w-4" /> Delete Record</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="font-headline text-lg mt-2 truncate">{resident.name}</CardTitle>
        <Badge variant={statusBadgeVariant} className={`mt-1 w-fit ${statusBadgeClass}`}>{resident.status.charAt(0).toUpperCase() + resident.status.slice(1)}</Badge>
      </CardHeader>
      <CardContent className="pt-3 pb-4 text-xs space-y-1.5 text-muted-foreground">
        <div className="flex items-center">
          <Phone className="mr-2 h-3.5 w-3.5 text-primary" /> {resident.contact}
        </div>
        <div className="flex items-center">
          <BedDouble className="mr-2 h-3.5 w-3.5 text-primary" /> Room: <span className="font-medium text-foreground ml-1">{assignedRoom ? assignedRoom.roomNumber : (resident.status === 'former' ? 'Vacated' : 'Unassigned')}</span>
        </div>
        {resident.joiningDate && (
            <div className="flex items-center">
                <CalendarDays className="mr-2 h-3.5 w-3.5 text-primary" /> Joined: <span className="font-medium text-foreground ml-1">{format(new Date(resident.joiningDate), 'dd MMM, yyyy')}</span>
            </div>
        )}
         {resident.idProofUrl ? (
            <div className="flex items-center pt-1">
                 <Image src={resident.idProofUrl} alt="ID Preview" width={48} height={32} className="rounded border object-contain mr-2" data-ai-hint="document id" />
                 <span className="text-xs text-foreground">ID Proof Attached</span>
            </div>
        ) : (
            <div className="flex items-center pt-1 text-muted-foreground/70">
                <UploadCloud className="mr-2 h-3.5 w-3.5" />
                <span className="text-xs">No ID Proof</span>
            </div>
        )}
      </CardContent>
       {/* <CardFooter className="pt-2 pb-3">
         Optional footer actions like a direct "View Full Profile" button if needed
      </CardFooter> */}
    </Card>
  );
}

