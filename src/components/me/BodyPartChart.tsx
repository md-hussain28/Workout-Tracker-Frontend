"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from "recharts";

import { useEffect, useState } from "react";

interface Props {
    data: any[];
    keys: { key: string; label: string; color: string }[];
    unit: string;
}

export default function BodyPartChart({ data, keys, unit }: Props) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || data.length === 0) return null;

    // Calculate min/max for Y-axis domain
    const allValues = data.flatMap(d => keys.map(k => d[k.key])).filter(v => typeof v === 'number');
    const minV = Math.floor(Math.min(...allValues) - 1);
    const maxV = Math.ceil(Math.max(...allValues) + 1);

    const isMulti = keys.length > 1;

    // Common Axis Props
    const xAxisProps = {
        dataKey: "date",
        tick: { fontSize: 11, fill: "oklch(0.65 0.02 260)" },
        tickLine: false,
        axisLine: false,
        interval: "preserveStartEnd" as const,
        minTickGap: 30,
    };

    const yAxisProps = {
        domain: [minV, maxV],
        tick: { fontSize: 11, fill: "oklch(0.65 0.02 260)" },
        tickLine: false,
        axisLine: false,
        width: 40,
    };

    const tooltipProps = {
        contentStyle: {
            backgroundColor: "oklch(0.19 0.02 260 / 0.95)",
            border: "1px solid oklch(0.3 0.03 260)",
            borderRadius: "12px",
            fontSize: "13px",
            backdropFilter: "blur(12px)",
        },
        labelStyle: { color: "oklch(0.65 0.02 260)", fontSize: "11px", marginBottom: "4px" },
        itemStyle: { padding: 0 },
        formatter: (value: number | string | undefined, name: string | undefined) => {
            if (value == null) return ["-", name || ""];
            return [`${value} ${unit}`, name];
        },
    };

    if (isMulti) {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 260 / 0.4)" vertical={false} />
                    <XAxis {...xAxisProps} />
                    <YAxis {...yAxisProps} />
                    <Tooltip {...tooltipProps} />
                    <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                    {keys.map((k) => (
                        <Line
                            key={k.key}
                            type="monotone"
                            dataKey={k.key}
                            name={k.label}
                            stroke={k.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    const primaryKey = keys[0];

    return (
        <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                    <linearGradient id="partGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={primaryKey.color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={primaryKey.color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 260 / 0.4)" vertical={false} />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip {...tooltipProps} formatter={(val) => [`${val} ${unit}`, primaryKey.label]} />
                <Area
                    type="monotone"
                    dataKey={primaryKey.key}
                    stroke={primaryKey.color}
                    strokeWidth={2.5}
                    fill="url(#partGradient)"
                    animationDuration={800}
                    dot={false}
                    activeDot={{
                        r: 5,
                        fill: primaryKey.color,
                        strokeWidth: 2,
                        stroke: "oklch(0.19 0.02 260)",
                    }}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
