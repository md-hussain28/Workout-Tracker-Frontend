"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { api } from "@/lib/api";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getWeekDates(): Date[] {
    const today = new Date();
    const day = today.getDay(); // 0=Sun
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((day + 6) % 7));
    monday.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
}

function fmt(d: Date) {
    return d.toISOString().slice(0, 10);
}

export function WeeklyRings() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekDates = getWeekDates();

    const { data: consistency } = useQuery({
        queryKey: ["analytics", "consistency", today.getFullYear(), today.getMonth() + 1],
        queryFn: () => api.analytics.consistency(today.getFullYear(), today.getMonth() + 1),
    });

    const trainedDates = new Set(consistency?.days?.map((d) => d.date.slice(0, 10)) ?? []);

    return (
        <div className="flex items-center justify-between gap-1 px-1">
            {weekDates.map((date, i) => {
                const dateStr = fmt(date);
                const isToday = dateStr === fmt(today);
                const isPast = date < today;
                const isFuture = date > today;
                const trained = trainedDates.has(dateStr);

                return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                        <span className={`text-[10px] font-semibold tracking-wider uppercase ${isToday ? "text-primary" : "text-muted-foreground/60"}`}>
                            {DAYS[i]}
                        </span>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
                            className="relative"
                        >
                            <svg width="40" height="40" viewBox="0 0 40 40">
                                {/* Background ring */}
                                <circle
                                    cx="20" cy="20" r="16"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    className={isFuture ? "text-muted/30" : "text-muted/50"}
                                    strokeDasharray={isToday && !trained ? "4 4" : "none"}
                                />
                                {/* Progress ring */}
                                {(trained || (isToday && !trained)) && (
                                    <circle
                                        cx="20" cy="20" r="16"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        className={trained ? "text-primary" : "text-primary/30"}
                                        strokeDasharray={`${trained ? 100.53 : 25} 100.53`}
                                        strokeDashoffset="0"
                                        transform="rotate(-90 20 20)"
                                    >
                                        {isToday && !trained && (
                                            <animate
                                                attributeName="stroke-dashoffset"
                                                values="0;-10;0"
                                                dur="3s"
                                                repeatCount="indefinite"
                                            />
                                        )}
                                    </circle>
                                )}
                            </svg>
                            {/* Center content */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                {trained ? (
                                    <Check className="size-4 text-primary" strokeWidth={3} />
                                ) : isPast ? (
                                    <span className="text-[10px] text-muted-foreground/40 font-medium">
                                        {date.getDate()}
                                    </span>
                                ) : (
                                    <span className={`text-[10px] font-medium ${isToday ? "text-primary" : "text-muted-foreground/30"}`}>
                                        {date.getDate()}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    </div>
                );
            })}
        </div>
    );
}
