"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Delete, Check } from "lucide-react";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onDone: () => void;
  allowDecimal?: boolean;
  showWeightSteppers?: boolean;
  className?: string;
}

const DIGITS_WITH_DECIMAL = ["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "⌫"];
const DIGITS_INTEGER = ["7", "8", "9", "4", "5", "6", "1", "2", "3", " ", "0", "⌫"];

export function NumericKeypad({
  value,
  onChange,
  onDone,
  allowDecimal = true,
  showWeightSteppers = false,
  className,
}: NumericKeypadProps) {
  function handleKey(key: string) {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (!allowDecimal || value.includes(".")) return;
      onChange(value === "" ? "0." : value + ".");
      return;
    }
    if (value === "0" && key !== ".") {
      onChange(key);
      return;
    }
    onChange(value + key);
  }

  function stepWeight(delta: number) {
    const n = parseFloat(value);
    const next = (isNaN(n) ? 0 : n) + delta;
    const rounded = Math.round(next * 10) / 10;
    onChange(rounded <= 0 ? "" : String(rounded));
  }

  const keys = allowDecimal ? DIGITS_WITH_DECIMAL : DIGITS_INTEGER;

  return (
    <div className={cn("rounded-xl border border-border bg-muted/30 p-2", className)}>
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {keys.map((key) => (
          <Button
            key={key === " " ? "space" : key}
            type="button"
            variant="secondary"
            size="sm"
            className={cn(
              "h-11 font-mono text-base rounded-xl bg-background hover:bg-muted border border-border shadow-sm",
              key === "⌫" && "col-span-1",
              key === " " && "invisible"
            )}
            onClick={() => key !== " " && handleKey(key)}
          >
            {key === "⌫" ? <Delete className="size-4" /> : key === " " ? null : key}
          </Button>
        ))}
      </div>
      {showWeightSteppers && (
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl font-medium text-muted-foreground border-border"
            onClick={() => stepWeight(-2.5)}
          >
            −2.5
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 rounded-xl font-medium text-muted-foreground border-border"
            onClick={() => stepWeight(2.5)}
          >
            +2.5
          </Button>
        </div>
      )}
      <Button
        type="button"
        className="w-full h-10 rounded-xl font-medium"
        onClick={onDone}
      >
        <Check className="mr-2 size-4" />
        Done
      </Button>
    </div>
  );
}
