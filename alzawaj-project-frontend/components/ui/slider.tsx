"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value);
      onValueChange?.([newValue]);
    };

    return (
      <input
        ref={ref}
        type="range"
        className={cn(
          "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer",
          "slider:bg-primary slider:h-2 slider:rounded-lg",
          "thumb:appearance-none thumb:w-5 thumb:h-5 thumb:bg-primary thumb:rounded-full thumb:cursor-pointer",
          className,
        )}
        value={value[0]}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
