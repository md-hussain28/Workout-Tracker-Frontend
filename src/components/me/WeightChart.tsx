"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

interface Props {
    data: { date: string; weight: number }[];
}

export default function WeightChart({ data }: Props) {
    if (data.length === 0) return null;

    const weights = data.map((d) => d.weight);
    const dataMin = Math.min(...weights);
    const dataMax = Math.max(...weights);
    const padding = Math.max(1, (dataMax - dataMin) * 0.1 || 1);
    const minW = Math.floor((dataMin - padding) * 10) / 10;
    const maxW = Math.ceil((dataMax + padding) * 10) / 10;
    const domain: [number, number] = minW < maxW ? [minW, maxW] : [minW, minW + 2];
    const showDecimals = dataMax - dataMin < 5;

    return (
        <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                    <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(0.7 0.15 262)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="oklch(0.7 0.15 262)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.3 0.03 260 / 0.4)"
                    vertical={false}
                />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "oklch(0.65 0.02 260)" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    domain={domain}
                    tick={{ fontSize: 11, fill: "oklch(0.65 0.02 260)" }}
                    tickFormatter={(v) => (showDecimals ? Number(v).toFixed(1) : String(Math.round(Number(v))))}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    allowDecimals={showDecimals}
                    tickCount={6}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "oklch(0.19 0.02 260 / 0.95)",
                        border: "1px solid oklch(0.3 0.03 260)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        backdropFilter: "blur(12px)",
                    }}
                    labelStyle={{ color: "oklch(0.65 0.02 260)", fontSize: "11px" }}
                    itemStyle={{ color: "oklch(0.9 0.005 260)" }}
                    formatter={(value: number | string | undefined) => [`${value} kg`, "Weight"]}
                />
                <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="oklch(0.7 0.15 262)"
                    strokeWidth={2.5}
                    fill="url(#weightGradient)"
                    animationDuration={800}
                    dot={false}
                    activeDot={{
                        r: 5,
                        fill: "oklch(0.7 0.15 262)",
                        strokeWidth: 2,
                        stroke: "oklch(0.19 0.02 260)",
                    }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
