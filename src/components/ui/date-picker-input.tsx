"use client";

import * as React from "react";
import { CalendarIcon, XIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  formatPhotoDate,
  formatPhotoDateValue,
  parsePhotoDate,
} from "@/lib/photo-date";
import { cn } from "@/lib/utils";

type DatePickerInputProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string, date?: Date) => void;
  placeholder?: string;
  className?: string;
  clearable?: boolean;
};

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }

  return !Number.isNaN(date.getTime());
}

export function DatePickerInput({
  id = "date-picker",
  label = "Date",
  value = "",
  onChange,
  placeholder = "Select date",
  className,
  clearable = true,
}: DatePickerInputProps) {
  const parsedDate = parsePhotoDate(value);
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(parsedDate);
  const [month, setMonth] = React.useState<Date | undefined>(parsedDate);
  const [inputValue, setInputValue] = React.useState(
    parsedDate ? formatPhotoDate(parsedDate) : value,
  );

  React.useEffect(() => {
    const nextDate = parsePhotoDate(value);
    setDate(nextDate);
    setMonth(nextDate);
    setInputValue(nextDate ? formatPhotoDate(nextDate) : value);
  }, [value]);

  const commitDate = (nextDate: Date | undefined) => {
    setDate(nextDate);
    setMonth(nextDate);

    if (!nextDate) {
      setInputValue("");
      onChange?.("", undefined);
      return;
    }

    const formatted = formatPhotoDate(nextDate);
    const stored = formatPhotoDateValue(nextDate);
    setInputValue(formatted);
    onChange?.(stored, nextDate);
  };

  return (
    <Field className={cn("w-full", className)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={id}
          value={inputValue}
          placeholder={placeholder}
          onChange={(event) => {
            const nextValue = event.target.value;
            setInputValue(nextValue);
            const nextDate = parsePhotoDate(nextValue);
            if (isValidDate(nextDate)) {
              setDate(nextDate);
              setMonth(nextDate);
              onChange?.(formatPhotoDateValue(nextDate), nextDate);
              return;
            }

            onChange?.(nextValue, undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        />
        <InputGroupAddon align="inline-end" className="gap-0.5">
          {clearable && inputValue ? (
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label="Clear date"
              onClick={() => {
                commitDate(undefined);
              }}
            >
              <XIcon />
            </InputGroupButton>
          ) : null}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                id={`${id}-trigger`}
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label="Open calendar"
              >
                <CalendarIcon />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden border border-border bg-popover p-0 text-popover-foreground shadow-lg"
              align="end"
              alignOffset={-8}
              sideOffset={10}
            >
              <Calendar
                className="bg-popover"
                mode="single"
                selected={date}
                month={month}
                onMonthChange={setMonth}
                onSelect={(nextDate) => {
                  commitDate(nextDate);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
