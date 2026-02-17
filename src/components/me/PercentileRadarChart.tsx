"use client";

import { useMemo, useState } from "react";
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Target, Info } from "lucide-react";

const PERCENTILE_LABELS: Record<string, string> = {
    chest: "Chest",
    waist: "Waist",
    hips: "Hips",
    neck: "Neck",
    shoulder: "Shoulders",
    bicep: "Bicep",
    forearm: "Forearm",
    thigh: "Thigh",
    calf: "Calf",
    wrist: "Wrist",
    ankle: "Ankle",
};

interface Props {
    percentiles: Record<string, number>;
}

const RELATIVE_STRENGTH_NOTE =
    "Each axis is your percentile vs. U.S. adults (NHANES 2017–2020). Uses the circumferences you log (neck, shoulders, chest, bicep, forearm, waist, hips, thigh, calf, ankle, wrist). Same measurement technique over time gives comparable, reliable trends.";

export default function PercentileRadarChart({ percentiles }: Props) {
    const [infoOpen, setInfoOpen] = useState(false);
    const data = useMemo(() => {
        return Object.entries(percentiles)
            .filter(([key]) => PERCENTILE_LABELS[key])
            .map(([key, value]) => ({
                subject: PERCENTILE_LABELS[key],
                value: Math.round(value),
                fullMark: 100,
            }))
            .sort((a, b) => {
                // Optional: Sort by logical body order or just keep them consistent
                // For radar, consistent order is key.
                const order = [
                    "Neck", "Shoulders", "Chest", "Bicep", "Forearm",
                    "Waist", "Hips", "Thigh", "Calf", "Ankle", "Wrist"
                ];
                return order.indexOf(a.subject) - order.indexOf(b.subject);
            });
    }, [percentiles]);

    if (data.length < 3) return null;

    return (
        <>
        <Card className="border-border/40">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="size-4 text-primary" />
                    Relative Strength
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full -ml-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                            <PolarGrid stroke="oklch(0.3 0.03 260 / 0.4)" />
                            <PolarAngleAxis
                                dataKey="subject"
                                tick={{ fill: "oklch(0.65 0.02 260)", fontSize: 11 }}
                            />
                            <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={false}
                                axisLine={false}
                            />
                            <Radar
                                name="Percentile"
                                dataKey="value"
                                stroke="oklch(0.72 0.16 165)"
                                strokeWidth={2.5}
                                fill="oklch(0.72 0.16 165)"
                                fillOpacity={0.4}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "oklch(0.19 0.02 260 / 0.95)",
                                    border: "1px solid oklch(0.3 0.03 260)",
                                    borderRadius: "12px",
                                    fontSize: "13px",
                                    backdropFilter: "blur(12px)",
                                }}
                                itemStyle={{ color: "oklch(0.9 0.005 260)" }}
                                formatter={(value: number | string | Array<number | string> | undefined) => [
                                    `${Number(value ?? 0).toFixed(0)}th`,
                                    "Percentile",
                                ]}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <button
                    type="button"
                    onClick={() => setInfoOpen(true)}
                    className="mt-2 inline-flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                    <Info className="size-3.5 shrink-0" />
                    How it&apos;s calculated
                </button>
            </CardContent>
        </Card>
        <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
            <DialogContent className="max-w-xs sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Relative Strength</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">{RELATIVE_STRENGTH_NOTE}</p>
            </DialogContent>
        </Dialog>
        </>
    );
}
