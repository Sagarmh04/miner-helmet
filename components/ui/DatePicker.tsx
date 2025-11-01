import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";
type DatePickerProps = {
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
};

export function DatePicker({ date, setDate }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
          {date.toLocaleDateString()}
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => d && setDate(d)} // <-- ignore undefined
          required
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
