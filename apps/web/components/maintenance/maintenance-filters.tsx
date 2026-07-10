"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAINTENANCE_PRIORITIES } from "@homeos/shared";

interface HomeOption {
  id: string;
  name: string;
}

interface MaintenanceFiltersProps {
  homes: HomeOption[];
  selectedHome: string;
  onHomeChange: (homeId: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
}

export function MaintenanceFilters({
  homes,
  selectedHome,
  onHomeChange,
  selectedPriority,
  onPriorityChange,
}: MaintenanceFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Select value={selectedHome} onValueChange={onHomeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Homes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Homes</SelectItem>
          {homes.map((home) => (
            <SelectItem key={home.id} value={home.id}>
              {home.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedPriority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          {Object.entries(MAINTENANCE_PRIORITIES).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
