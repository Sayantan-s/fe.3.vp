"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { BG_OPTIONS, BG_OPTION_KEYS } from "./bg-options";
import styles from "./background-swatch.module.css";

interface BackgroundSwatchProps {
  value: number;
  onValueChange: (key: number) => void;
}

export function BackgroundSwatch({ value, onValueChange }: BackgroundSwatchProps) {
  return (
    <RadioGroup.Root
      className={styles.grid}
      value={String(value)}
      onValueChange={(v) => onValueChange(Number(v))}
    >
      {BG_OPTION_KEYS.map((key) => {
        const option = BG_OPTIONS[key];
        return (
          <RadioGroup.Item
            key={key}
            value={String(key)}
            className={styles.item}
            aria-label={option.label}
          >
            <img
              src={option.src}
              alt={option.label}
              className={styles.thumbnail}
            />
            <span className={styles.checkOverlay}>
              <span className={styles.checkCircle}>
                <Check size={14} color="#1A1A1A" />
              </span>
            </span>
          </RadioGroup.Item>
        );
      })}
    </RadioGroup.Root>
  );
}
