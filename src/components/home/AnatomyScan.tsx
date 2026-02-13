"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api, type RecoveryMuscle } from "@/lib/api";

// ── Muscle-key → SVG path mapping ──
// Maps normalised muscle names from the backend to front/back body regions
const MUSCLE_MAP: Record<string, { side: "front" | "back"; paths: string[] }> = {
    chest: { side: "front", paths: ["chest-l", "chest-r"] },
    shoulders: { side: "front", paths: ["delt-l", "delt-r"] },
    biceps: { side: "front", paths: ["bicep-l", "bicep-r"] },
    forearms: { side: "front", paths: ["forearm-l", "forearm-r"] },
    abs: { side: "front", paths: ["abs"] },
    core: { side: "front", paths: ["abs"] },
    quads: { side: "front", paths: ["quad-l", "quad-r"] },
    quadriceps: { side: "front", paths: ["quad-l", "quad-r"] },
    hip_flexors: { side: "front", paths: ["hip-l", "hip-r"] },
    tibialis: { side: "front", paths: ["shin-l", "shin-r"] },
    traps: { side: "back", paths: ["trap-l", "trap-r"] },
    trapezius: { side: "back", paths: ["trap-l", "trap-r"] },
    lats: { side: "back", paths: ["lat-l", "lat-r"] },
    back: { side: "back", paths: ["lat-l", "lat-r"] },
    lower_back: { side: "back", paths: ["lower-back"] },
    rear_delts: { side: "back", paths: ["rear-delt-l", "rear-delt-r"] },
    triceps: { side: "back", paths: ["tricep-l", "tricep-r"] },
    glutes: { side: "back", paths: ["glute-l", "glute-r"] },
    hamstrings: { side: "back", paths: ["ham-l", "ham-r"] },
    calves: { side: "back", paths: ["calf-l", "calf-r"] },
};

function getFillColor(score: number): string {
    if (score <= 0.2) return "rgba(255,255,255,0)";
    if (score <= 0.5) return "oklch(0.7 0.15 262 / 0.25)";
    if (score <= 0.7) return "oklch(0.7 0.15 262 / 0.45)";
    return "oklch(0.7 0.15 262 / 0.85)";
}

function getStroke(score: number): string {
    if (score <= 0.2) return "oklch(1 0 0 / 0.08)";
    return "oklch(1 0 0 / 0.12)";
}

// ── Reusable muscle path component ──
function MusclePath({
    id,
    d,
    score,
    overstrained,
}: {
    id: string;
    d: string;
    score: number;
    overstrained: boolean;
}) {
    return (
        <path
            id={id}
            d={d}
            fill={getFillColor(score)}
            stroke={getStroke(score)}
            strokeWidth={0.5}
            className={overstrained ? "animate-pulse" : ""}
            style={
                overstrained
                    ? { filter: "drop-shadow(0 0 8px oklch(0.7 0.15 262))" }
                    : undefined
            }
        />
    );
}

// ── Build score map from API response ──
function buildScoreMap(muscles: RecoveryMuscle[]): Map<string, { score: number; overstrained: boolean }> {
    const map = new Map<string, { score: number; overstrained: boolean }>();
    for (const m of muscles) {
        const mapping = MUSCLE_MAP[m.key];
        if (mapping) {
            for (const pathId of mapping.paths) {
                map.set(pathId, { score: m.fatigue_score, overstrained: m.overstrained });
            }
        }
    }
    return map;
}

function getPathProps(id: string, scoreMap: Map<string, { score: number; overstrained: boolean }>) {
    const data = scoreMap.get(id);
    return {
        score: data?.score ?? 0,
        overstrained: data?.overstrained ?? false,
    };
}

// ── Front Body SVG ──
function FrontBody({ scoreMap }: { scoreMap: Map<string, { score: number; overstrained: boolean }> }) {
    return (
        <svg viewBox="0 0 200 440" className="w-full h-full max-h-[320px]" preserveAspectRatio="xMidYMid meet">
            {/* Head */}
            <ellipse cx="100" cy="30" rx="20" ry="25" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth={0.5} />

            {/* Neck */}
            <rect x="92" y="55" width="16" height="12" rx="3" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth={0.5} />

            {/* Delts */}
            <MusclePath id="delt-l" d="M70,72 Q60,68 55,80 Q52,90 58,100 L74,95 Q78,85 74,75 Z" {...getPathProps("delt-l", scoreMap)} />
            <MusclePath id="delt-r" d="M130,72 Q140,68 145,80 Q148,90 142,100 L126,95 Q122,85 126,75 Z" {...getPathProps("delt-r", scoreMap)} />

            {/* Chest */}
            <MusclePath id="chest-l" d="M74,75 Q78,85 74,100 L74,110 Q80,118 98,118 L98,75 Q90,68 74,75 Z" {...getPathProps("chest-l", scoreMap)} />
            <MusclePath id="chest-r" d="M126,75 Q122,85 126,100 L126,110 Q120,118 102,118 L102,75 Q110,68 126,75 Z" {...getPathProps("chest-r", scoreMap)} />

            {/* Biceps */}
            <MusclePath id="bicep-l" d="M55,102 Q48,115 46,140 Q46,150 50,155 L60,155 Q66,140 63,120 L58,100 Z" {...getPathProps("bicep-l", scoreMap)} />
            <MusclePath id="bicep-r" d="M145,102 Q152,115 154,140 Q154,150 150,155 L140,155 Q134,140 137,120 L142,100 Z" {...getPathProps("bicep-r", scoreMap)} />

            {/* Forearms */}
            <MusclePath id="forearm-l" d="M46,155 Q42,175 40,200 Q39,210 42,215 L52,215 Q56,195 55,175 L60,155 Z" {...getPathProps("forearm-l", scoreMap)} />
            <MusclePath id="forearm-r" d="M154,155 Q158,175 160,200 Q161,210 158,215 L148,215 Q144,195 145,175 L140,155 Z" {...getPathProps("forearm-r", scoreMap)} />

            {/* Abs */}
            <MusclePath id="abs" d="M82,120 L82,195 Q85,205 100,208 Q115,205 118,195 L118,120 Q110,115 100,118 Q90,115 82,120 Z" {...getPathProps("abs", scoreMap)} />

            {/* Hip flexors */}
            <MusclePath id="hip-l" d="M82,195 Q80,210 78,218 L96,218 Q98,208 98,200 Z" {...getPathProps("hip-l", scoreMap)} />
            <MusclePath id="hip-r" d="M118,195 Q120,210 122,218 L104,218 Q102,208 102,200 Z" {...getPathProps("hip-r", scoreMap)} />

            {/* Quads */}
            <MusclePath id="quad-l" d="M76,220 Q72,260 72,300 Q73,315 78,325 L96,325 Q100,310 98,280 Q98,250 96,220 Z" {...getPathProps("quad-l", scoreMap)} />
            <MusclePath id="quad-r" d="M124,220 Q128,260 128,300 Q127,315 122,325 L104,325 Q100,310 102,280 Q102,250 104,220 Z" {...getPathProps("quad-r", scoreMap)} />

            {/* Shins */}
            <MusclePath id="shin-l" d="M76,330 Q74,360 74,390 Q74,405 78,420 L90,420 Q92,405 90,380 Q90,355 92,330 Z" {...getPathProps("shin-l", scoreMap)} />
            <MusclePath id="shin-r" d="M124,330 Q126,360 126,390 Q126,405 122,420 L110,420 Q108,405 110,380 Q110,355 108,330 Z" {...getPathProps("shin-r", scoreMap)} />

            {/* Hands (cosmetic) */}
            <ellipse cx="47" cy="225" rx="8" ry="10" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />
            <ellipse cx="153" cy="225" rx="8" ry="10" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />

            {/* Feet (cosmetic) */}
            <ellipse cx="84" cy="432" rx="10" ry="6" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />
            <ellipse cx="116" cy="432" rx="10" ry="6" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />
        </svg>
    );
}

// ── Back Body SVG ──
function BackBody({ scoreMap }: { scoreMap: Map<string, { score: number; overstrained: boolean }> }) {
    return (
        <svg viewBox="0 0 200 440" className="w-full h-full max-h-[320px]" preserveAspectRatio="xMidYMid meet">
            {/* Head */}
            <ellipse cx="100" cy="30" rx="20" ry="25" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth={0.5} />

            {/* Neck */}
            <rect x="92" y="55" width="16" height="12" rx="3" fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth={0.5} />

            {/* Traps */}
            <MusclePath id="trap-l" d="M92,67 L74,72 Q68,78 66,85 L80,85 Q88,80 92,72 Z" {...getPathProps("trap-l", scoreMap)} />
            <MusclePath id="trap-r" d="M108,67 L126,72 Q132,78 134,85 L120,85 Q112,80 108,72 Z" {...getPathProps("trap-r", scoreMap)} />

            {/* Rear Delts */}
            <MusclePath id="rear-delt-l" d="M66,85 Q58,82 54,90 Q52,98 56,105 L72,100 Q74,90 70,85 Z" {...getPathProps("rear-delt-l", scoreMap)} />
            <MusclePath id="rear-delt-r" d="M134,85 Q142,82 146,90 Q148,98 144,105 L128,100 Q126,90 130,85 Z" {...getPathProps("rear-delt-r", scoreMap)} />

            {/* Lats */}
            <MusclePath id="lat-l" d="M72,88 L72,170 Q78,180 98,180 L98,88 Q88,82 72,88 Z" {...getPathProps("lat-l", scoreMap)} />
            <MusclePath id="lat-r" d="M128,88 L128,170 Q122,180 102,180 L102,88 Q112,82 128,88 Z" {...getPathProps("lat-r", scoreMap)} />

            {/* Triceps */}
            <MusclePath id="tricep-l" d="M56,105 Q48,120 46,145 Q46,155 50,160 L62,160 Q66,145 64,125 L60,105 Z" {...getPathProps("tricep-l", scoreMap)} />
            <MusclePath id="tricep-r" d="M144,105 Q152,120 154,145 Q154,155 150,160 L138,160 Q134,145 136,125 L140,105 Z" {...getPathProps("tricep-r", scoreMap)} />

            {/* Lower Back */}
            <MusclePath id="lower-back" d="M84,180 L84,210 Q90,218 100,218 Q110,218 116,210 L116,180 Q110,175 100,178 Q90,175 84,180 Z" {...getPathProps("lower-back", scoreMap)} />

            {/* Glutes */}
            <MusclePath id="glute-l" d="M82,218 Q78,235 78,250 L98,250 Q100,240 100,230 Q100,218 96,218 Z" {...getPathProps("glute-l", scoreMap)} />
            <MusclePath id="glute-r" d="M118,218 Q122,235 122,250 L102,250 Q100,240 100,230 Q100,218 104,218 Z" {...getPathProps("glute-r", scoreMap)} />

            {/* Hamstrings */}
            <MusclePath id="ham-l" d="M76,255 Q72,290 72,320 Q73,330 78,335 L96,335 Q100,320 98,290 Q98,270 96,255 Z" {...getPathProps("ham-l", scoreMap)} />
            <MusclePath id="ham-r" d="M124,255 Q128,290 128,320 Q127,330 122,335 L104,335 Q100,320 102,290 Q102,270 104,255 Z" {...getPathProps("ham-r", scoreMap)} />

            {/* Calves */}
            <MusclePath id="calf-l" d="M76,340 Q74,365 74,390 Q74,405 78,420 L92,420 Q94,400 92,375 Q92,360 94,340 Z" {...getPathProps("calf-l", scoreMap)} />
            <MusclePath id="calf-r" d="M124,340 Q126,365 126,390 Q126,405 122,420 L108,420 Q106,400 108,375 Q108,360 106,340 Z" {...getPathProps("calf-r", scoreMap)} />

            {/* Hands (cosmetic) */}
            <ellipse cx="47" cy="225" rx="8" ry="10" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />
            <ellipse cx="153" cy="225" rx="8" ry="10" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />

            {/* Feet (cosmetic) */}
            <ellipse cx="84" cy="432" rx="10" ry="6" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />
            <ellipse cx="116" cy="432" rx="10" ry="6" fill="none" stroke="oklch(1 0 0 / 0.05)" strokeWidth={0.5} />
        </svg>
    );
}

// ── Legend ──
function HeatLegend() {
    const stops = [
        { label: "Ready", color: "oklch(1 0 0 / 0.05)" },
        { label: "Active", color: "oklch(0.7 0.15 262 / 0.4)" },
        { label: "Fatigued", color: "oklch(0.7 0.15 262 / 0.85)" },
    ];
    return (
        <div className="flex items-center justify-center gap-4">
            {stops.map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full" style={{ background: s.color, border: "1px solid oklch(1 0 0 / 0.1)" }} />
                    <span className="text-[10px] text-muted-foreground">{s.label}</span>
                </div>
            ))}
        </div>
    );
}

// ── Main Component ──
export function AnatomyScan() {
    const { data, isLoading } = useQuery({
        queryKey: ["analytics", "recovery"],
        queryFn: () => api.analytics.recovery(),
        refetchInterval: 60_000, // refresh every minute
    });

    const scoreMap = buildScoreMap(data?.muscles ?? []);

    // Count active (fatigued) muscles
    const activeMuscles = (data?.muscles ?? []).filter((m) => m.fatigue_score > 0.2).length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
            className="col-span-4 glass rounded-2xl p-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Readiness Scan
                </h3>
                <div className="flex items-center gap-1.5">
                    <span className="relative flex size-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                    </span>
                    <span className="text-[9px] font-[family-name:var(--font-geist-mono)] text-muted-foreground uppercase tracking-widest">
                        Scan Active
                    </span>
                </div>
            </div>

            {/* Body silhouettes */}
            <div className="flex items-start justify-center gap-2">
                <div className="flex-1 flex flex-col items-center">
                    <FrontBody scoreMap={scoreMap} />
                    <span className="text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-wider">Front</span>
                </div>
                <div className="w-px h-48 self-center bg-border/30" />
                <div className="flex-1 flex flex-col items-center">
                    <BackBody scoreMap={scoreMap} />
                    <span className="text-[9px] text-muted-foreground/50 mt-1 uppercase tracking-wider">Back</span>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-3">
                <HeatLegend />
            </div>

            {/* Summary badges */}
            {activeMuscles > 0 && (
                <div className="mt-2 text-center">
                    <span className="text-[10px] text-muted-foreground">
                        {activeMuscles} muscle group{activeMuscles !== 1 ? "s" : ""} with recent activity
                    </span>
                </div>
            )}
        </motion.div>
    );
}
