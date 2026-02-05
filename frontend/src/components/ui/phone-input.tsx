'use client';

import * as React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';
import { type Value } from 'react-phone-number-input';

export interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  error?: boolean;
  placeholder?: string;
  defaultCountry?: React.ComponentProps<typeof PhoneInput>['defaultCountry'];
}

export function PhoneNumberInput({
  value,
  onChange,
  className,
  error,
  placeholder = 'Enter phone number',
  defaultCountry = 'US'
}: PhoneInputProps) {
  // Custom styles to match the Input component
  // We need to target the internal classes of react-phone-number-input
  const inputClass = "flex h-12 w-full rounded-md border border-input bg-white/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 hover:bg-white/80 focus:bg-white";

  // Handle paste events to ensure pasting works properly
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Allow the default paste behavior - the library will handle formatting
    // Just ensure the event isn't prevented
    e.stopPropagation();
  };

  return (
    <div className={cn(
      "phone-input-container space-y-2",
      /* Scoped styles for the library component to match our theme */
      "[&_.PhoneInputInput]:flex [&_.PhoneInputInput]:h-12 [&_.PhoneInputInput]:w-full [&_.PhoneInputInput]:rounded-md [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-3 [&_.PhoneInputInput]:py-2 [&_.PhoneInputInput]:text-sm [&_.PhoneInputInput]:placeholder:text-muted-foreground [&_.PhoneInputInput]:focus-visible:outline-none disabled:[&_.PhoneInputInput]:cursor-not-allowed disabled:[&_.PhoneInputInput]:opacity-50",
      "[&_.PhoneInputCountry]:mr-2 [&_.PhoneInputCountry]:ml-3",
      /* Container styling treating the whole thing as an input */
      "flex items-center rounded-md border border-input bg-white/50 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-white/80 focus-within:bg-white transition-all duration-200",
      error && "border-destructive focus-within:ring-destructive",
      className
    )}>
      <PhoneInput
        international
        defaultCountry={defaultCountry}
        value={value as Value}
        onChange={(val) => onChange(val as string)}
        placeholder={placeholder}
        className="flex w-full items-center"
        /* The library puts the input in a simple HTML input key, so we prevent it from having its own borders/styles
           since the container handles the look. Override default library styles. */
        numberInputProps={{
          className: "bg-transparent border-0 outline-none h-full w-full text-sm",
          onPaste: handlePaste,
        }}
      />
    </div>
  );
}
