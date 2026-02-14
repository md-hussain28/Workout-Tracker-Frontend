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
        tick: { fontSize: 10, fill: "oklch(0.55 0.02 260)" },
        tickLine: false,
        axisLine: false,
        interval: "preserveStartEnd" as const,
        minTickGap: 40,
        dy: 10,
    };

    const yAxisProps = {
        domain: [minV, maxV],
        tick: { fontSize: 10, fill: "oklch(0.55 0.02 260)" },
        tickLine: false,
        axisLine: false,
        width: 35,
        dx: -5,
    };

    const tooltipProps = {
        contentStyle: {
            backgroundColor: "rgba(20, 20, 25, 0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
            fontSize: "13px",
            padding: "8px 12px",
        },
        labelStyle: { color: "oklch(0.7 0.02 260)", fontSize: "11px", marginBottom: "4px", fontWeight: 500 },
        itemStyle: { padding: 0, fontWeight: 600 },
        cursor: { stroke: "oklch(0.55 0.02 260)", strokeWidth: 1, strokeDasharray: "4 4" },
        formatter: (value: number | string | undefined, name: string | undefined) => {
            if (value == null) return ["-", name || ""];
            return [`${value} ${unit}`, name];
        },
    };

    if (isMulti) {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 260 / 0.2)" vertical={false} />
                    <XAxis {...xAxisProps} />
                    <YAxis {...yAxisProps} />
                    <Tooltip {...tooltipProps} />
                    <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "15px", opacity: 0.8 }}
                        iconType="circle"
                        iconSize={8}
                    />
                    {keys.map((k) => (
                        <Line
                            key={k.key}
                            type="monotone"
                            dataKey={k.key}
                            name={k.label}
                            stroke={k.color}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, stroke: "#000" }}
                            connectNulls
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    }

    const primaryKey = keys[0];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                    <linearGradient id="partGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={primaryKey.color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={primaryKey.color} stopOpacity={0.0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.3 0.03 260 / 0.2)" vertical={false} />
                <XAxis {...xAxisProps} />
                <YAxis {...yAxisProps} />
                <Tooltip {...tooltipProps} formatter={(val) => [`${val} ${unit}`, primaryKey.label]} />
                <Area
                    type="monotone"
                    dataKey={primaryKey.key}
                    stroke={primaryKey.color}
                    strokeWidth={2}
                    fill="url(#partGradient)"
                    animationDuration={1000}
                    dot={false}
                    activeDot={{
                        r: 5,
                        fill: primaryKey.color,
                        strokeWidth: 2,
                        stroke: "#000",
                    }}
                    connectNulls
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
