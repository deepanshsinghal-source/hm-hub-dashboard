import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, MapPin, Star, ChevronDown, ChevronUp } from "lucide-react";

/**
 * HUB SUMMARY — UX Designer Revamp ✨
 *
 * Behaviors:
 * - KPI row: Total toggles collapse/expand of visits; other KPIs filter + auto-open visits
 * - Scheduled visits: RM may be unassigned (show “RM Pending”)
 * - Cancelled visits: visible and filterable
 * - Feedback Radar has 2 views:
 *   - Hub view: lead-level feedback cards (filters by rating)
 *   - RM view: RM-wise table (<3, >=3, NF, Total)
 * - Feedback date range filters feedback only
 * - Lead ID is always displayed
 */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

type VisitType = "HV" | "HTD";
type Scope = VisitType | "ALL";
type Status = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";

type Visit = {
    leadId: string;
    id: string;
    type: VisitType;
    dateISO: string; // YYYY-MM-DD
    time: string; // HH:mm
    customer: string;
    car: string;
    rm?: string;
    status: Status;
    feedbackRating?: 1 | 2 | 3 | 4 | 5;
    feedbackText?: string;
};

type FocusStatus = "ALL" | Status;
type FocusRating = "ALL" | "NF" | 1 | 2 | 3 | 4 | 5;
type RangeKey = "1D" | "2D" | "7D" | "CUSTOM";
type FeedbackView = "HUB" | "RM";

function pad2(n: number) {
    return String(n).padStart(2, "0");
}

function statusLabel(s: Status) {
    return s.charAt(0) + s.slice(1).toLowerCase();
}

function parseISODate(iso: string): Date {
    const [y, m, d] = iso.split("-").map((x) => Number(x));
    return new Date(y, (m || 1) - 1, d || 1);
}

function formatISODate(d: Date): string {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDaysISO(iso: string, deltaDays: number): string {
    const d = parseISODate(iso);
    d.setDate(d.getDate() + deltaDays);
    return formatISODate(d);
}

function getRangeStartISO(endISO: string, range: RangeKey, customStartISO: string): string {
    if (range === "CUSTOM") return customStartISO || endISO;
    if (range === "1D") return endISO;
    if (range === "2D") return addDaysISO(endISO, -1);
    return addDaysISO(endISO, -6);
}

function inISOInclusiveRange(dISO: string, startISO: string, endISO: string): boolean {
    return dISO >= startISO && dISO <= endISO;
}

function ensureLeadId(leadId: string | undefined, index: number): string {
    const raw = String(leadId ?? "").trim();
    return raw ? raw : `LD-${10000 + index}`;
}

function generateVisits(baseDateISO: string): Visit[] {
    const d0 = baseDateISO;
    const d1 = addDaysISO(baseDateISO, -1);
    const d2 = addDaysISO(baseDateISO, -2);
    const d3 = addDaysISO(baseDateISO, -3);
    const d5 = addDaysISO(baseDateISO, -5);
    const d6 = addDaysISO(baseDateISO, -6);

    return [
        // ===== TODAY =====
        {
            leadId: "LD-10021",
            id: "1",
            type: "HV",
            dateISO: d0,
            time: "10:15",
            customer: "Amit K.",
            car: "Swift",
            rm: "Aman",
            status: "COMPLETED",
            feedbackRating: 4,
            feedbackText: "Good experience",
        },
        {
            leadId: "LD-10022",
            id: "2",
            type: "HV",
            dateISO: d0,
            time: "11:05",
            customer: "Sandeep R.",
            car: "Baleno",
            rm: "Aman",
            status: "COMPLETED",
            feedbackRating: 5,
            feedbackText: "Excellent support",
        },
        {
            leadId: "LD-10024",
            id: "2b",
            type: "HTD",
            dateISO: d0,
            time: "12:10",
            customer: "Varun T.",
            car: "Verna",
            rm: "Neha",
            status: "COMPLETED",
            feedbackRating: 3,
            feedbackText: "Average coordination",
        },
        {
            leadId: "LD-10025",
            id: "2c",
            type: "HV",
            dateISO: d0,
            time: "13:00",
            customer: "Pooja M.",
            car: "i10",
            rm: "Rohit",
            status: "COMPLETED",
            // NF
        },
        {
            leadId: "LD-10052",
            id: "3",
            type: "HV",
            dateISO: d0,
            time: "14:10",
            customer: "Rahul P.",
            car: "Creta",
            rm: "Rohit",
            status: "ONGOING",
        },
        {
            leadId: "LD-10036",
            id: "4",
            type: "HTD",
            dateISO: d0,
            time: "15:00",
            customer: "Ritika M.",
            car: "City",
            status: "SCHEDULED",
        },
        {
            leadId: "LD-10040",
            id: "4b",
            type: "HV",
            dateISO: d0,
            time: "16:20",
            customer: "Vivek S.",
            car: "Brezza",
            status: "CANCELLED",
        },

        // ===== YESTERDAY =====
        {
            leadId: "LD-10023",
            id: "5",
            type: "HV",
            dateISO: d1,
            time: "12:30",
            customer: "Nikhil P.",
            car: "i20",
            rm: "Aman",
            status: "COMPLETED",
            feedbackRating: 2,
            feedbackText: "Delay in arrival",
        },
        {
            leadId: "LD-10034",
            id: "6",
            type: "HTD",
            dateISO: d1,
            time: "12:40",
            customer: "Diya S.",
            car: "i20",
            rm: "Neha",
            status: "COMPLETED",
            // NF
        },
        {
            leadId: "LD-10041",
            id: "6b",
            type: "HV",
            dateISO: d1,
            time: "14:00",
            customer: "Manish G.",
            car: "Kushaq",
            rm: "Sahil",
            status: "COMPLETED",
            feedbackRating: 5,
            feedbackText: "Very professional",
        },

        // ===== 2 DAYS AGO =====
        {
            leadId: "LD-10042",
            id: "7",
            type: "HV",
            dateISO: d2,
            time: "10:45",
            customer: "Rhea S.",
            car: "Amaze",
            rm: "Priya",
            status: "COMPLETED",
            feedbackRating: 4,
            feedbackText: "Smooth process",
        },
        {
            leadId: "LD-10043",
            id: "8",
            type: "HTD",
            dateISO: d2,
            time: "15:15",
            customer: "Arpit N.",
            car: "Venue",
            rm: "Aman",
            status: "COMPLETED",
            feedbackRating: 1,
            feedbackText: "Unhappy with demo",
        },

        // ===== 3 DAYS AGO =====
        {
            leadId: "LD-10088",
            id: "9",
            type: "HV",
            dateISO: d3,
            time: "11:20",
            customer: "Arjun B.",
            car: "Scorpio",
            rm: "Sahil",
            status: "COMPLETED",
            feedbackRating: 3,
            feedbackText: "Decent visit",
        },
        {
            leadId: "LD-10089",
            id: "10",
            type: "HTD",
            dateISO: d3,
            time: "16:10",
            customer: "Megha L.",
            car: "Amaze",
            rm: "Priya",
            status: "COMPLETED",
            feedbackRating: 1,
            feedbackText: "Not satisfied",
        },
        {
            leadId: "LD-10044",
            id: "10b",
            type: "HV",
            dateISO: d3,
            time: "17:30",
            customer: "Saurabh D.",
            car: "Harrier",
            rm: "Neha",
            status: "COMPLETED",
            feedbackRating: 4,
            feedbackText: "Good explanation",
        },

        // ===== 5 DAYS AGO =====
        {
            leadId: "LD-10045",
            id: "11",
            type: "HV",
            dateISO: d5,
            time: "09:50",
            customer: "Kriti A.",
            car: "Ertiga",
            rm: "Rohit",
            status: "COMPLETED",
            feedbackRating: 5,
            feedbackText: "Fantastic service",
        },
        {
            leadId: "LD-10046",
            id: "12",
            type: "HTD",
            dateISO: d5,
            time: "13:40",
            customer: "Aditya V.",
            car: "Altroz",
            rm: "Sahil",
            status: "COMPLETED",
            // NF
        },

        // ===== 6 DAYS AGO =====
        {
            leadId: "LD-10090",
            id: "13",
            type: "HV",
            dateISO: d6,
            time: "10:40",
            customer: "Kunal R.",
            car: "Creta",
            rm: "Neha",
            status: "COMPLETED",
            feedbackRating: 4,
            feedbackText: "Smooth",
        },
        {
            leadId: "LD-10091",
            id: "14",
            type: "HTD",
            dateISO: d6,
            time: "13:00",
            customer: "Deepak S.",
            car: "Fortuner",
            rm: "Priya",
            status: "COMPLETED",
            // NF
        },
    ];
}

export default function HubSummaryDesignerRevamp() {
    const todayISO = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }, []);

    const [dateISO, setDateISO] = useState(todayISO);
    const [scope, setScope] = useState<Scope>("ALL");

    const [focusStatus, setFocusStatus] = useState<FocusStatus>("ALL");
    const [visitsOpen, setVisitsOpen] = useState(true);

    const [rangeKey, setRangeKey] = useState<RangeKey>("1D");
    const [customStartISO, setCustomStartISO] = useState(todayISO);

    const [feedbackView, setFeedbackView] = useState<FeedbackView>("HUB");
    const [focusRating, setFocusRating] = useState<FocusRating>("ALL");

    const visitsRaw = useMemo(() => generateVisits(dateISO), [dateISO]);

    const visits = useMemo(() => {
        return visitsRaw.map((v, i) => ({ ...v, leadId: ensureLeadId(v.leadId, i) }));
    }, [visitsRaw]);

    const scoped = useMemo(() => {
        if (scope === "ALL") return visits;
        return visits.filter((v) => v.type === scope);
    }, [scope, visits]);

    const counts = useMemo(() => {
        return {
            total: scoped.length,
            completed: scoped.filter((v) => v.status === "COMPLETED").length,
            ongoing: scoped.filter((v) => v.status === "ONGOING").length,
            scheduled: scoped.filter((v) => v.status === "SCHEDULED").length,
            cancelled: scoped.filter((v) => v.status === "CANCELLED").length,
        };
    }, [scoped]);

    const visibleVisits = useMemo(() => {
        const list = focusStatus === "ALL" ? scoped : scoped.filter((v) => v.status === focusStatus);
        // show in time order
        return list.slice().sort((a, b) => (a.time + a.id).localeCompare(b.time + b.id));
    }, [scoped, focusStatus]);

    const rangeStartISO = useMemo(
        () => getRangeStartISO(dateISO, rangeKey, customStartISO),
        [dateISO, rangeKey, customStartISO]
    );

    const completedInRange = useMemo(() => {
        return scoped.filter(
            (v) => v.status === "COMPLETED" && inISOInclusiveRange(v.dateISO, rangeStartISO, dateISO)
        );
    }, [scoped, rangeStartISO, dateISO]);

    const ratingCounts = useMemo(() => {
        const out: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0, NF: 0 };
        completedInRange.forEach((v) => {
            if (typeof v.feedbackRating === "number") out[String(v.feedbackRating)]++;
            else out.NF++;
        });
        return out;
    }, [completedInRange]);

    const visibleFeedback = useMemo(() => {
        if (focusRating === "ALL") return completedInRange;
        if (focusRating === "NF") return completedInRange.filter((v) => !v.feedbackRating);
        return completedInRange.filter((v) => v.feedbackRating === focusRating);
    }, [completedInRange, focusRating]);

    const rmAggregated = useMemo(() => {
        const map: Record<string, { total: number; below3: number; aboveEq3: number; nf: number }> = {};

        completedInRange.forEach((v) => {
            const rmName = v.rm || "Unassigned";
            if (!map[rmName]) map[rmName] = { total: 0, below3: 0, aboveEq3: 0, nf: 0 };

            map[rmName].total += 1;
            if (typeof v.feedbackRating === "number") {
                if (v.feedbackRating < 3) map[rmName].below3 += 1;
                else map[rmName].aboveEq3 += 1;
            } else {
                map[rmName].nf += 1;
            }
        });

        return Object.entries(map)
            .map(([rm, d]) => ({ rm, ...d }))
            .sort((a, b) => b.total - a.total);
    }, [completedInRange]);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="sticky top-0 z-40 border-b bg-white">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <div>
                        <CardTitle className="text-lg">Hub Manager Daily Snapshot</CardTitle>
                        <p className="text-xs text-slate-600">One glance → track visits + spot feedback risks</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <CalendarDays className="h-4 w-4" />
                        <Input
                            type="date"
                            value={dateISO}
                            onChange={(e) => {
                                setDateISO(e.target.value);
                                setCustomStartISO(e.target.value);
                            }}
                            className="w-[160px]"
                        />
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
                <Card className="rounded-2xl">
                    <CardHeader>
                        {/* Scope */}
                        <div className="flex gap-2">
                            {(["ALL", "HV", "HTD"] as Scope[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setScope(t)}
                                    className={cx(
                                        "px-4 py-2 rounded-xl border text-sm font-semibold",
                                        scope === t ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* KPI Row */}
                        <div className="grid grid-cols-5 gap-3">
                            {[
                                { key: "ALL" as const, label: "Total", value: counts.total, collapsible: true },
                                { key: "COMPLETED" as const, label: "Completed", value: counts.completed },
                                { key: "ONGOING" as const, label: "Ongoing", value: counts.ongoing },
                                { key: "SCHEDULED" as const, label: "Scheduled", value: counts.scheduled },
                                { key: "CANCELLED" as const, label: "Cancelled", value: counts.cancelled },
                            ].map((k) => (
                                <button
                                    key={k.key}
                                    type="button"
                                    onClick={() => {
                                        if (k.collapsible) {
                                            setVisitsOpen((v) => !v);
                                            setFocusStatus("ALL");
                                        } else {
                                            setFocusStatus(k.key as FocusStatus);
                                            setVisitsOpen(true);
                                        }
                                    }}
                                    className={cx(
                                        "rounded-xl border p-3 text-left transition",
                                        focusStatus === k.key ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                    )}
                                >
                                    <p className="text-xs text-slate-600 font-semibold">{k.label}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                                        {k.collapsible && (
                                            <span className="text-slate-600">
                                                {visitsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <Separator className="my-6" />

                        {/* Main Layout */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Left: Visits Timeline */}
                            <div className="md:col-span-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-slate-900">Today’s Visits</p>
                                    {focusStatus !== "ALL" && (
                                        <button
                                            type="button"
                                            onClick={() => setFocusStatus("ALL")}
                                            className="text-xs font-semibold text-slate-600 hover:underline"
                                        >
                                            Clear filter
                                        </button>
                                    )}
                                </div>

                                {visitsOpen ? (
                                    <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                        {visibleVisits.slice(0, 20).map((v) => (
                                            <div key={v.id} className="rounded-xl border bg-white p-3 flex items-start justify-between">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900 truncate">
                                                        {v.time} · {v.customer}
                                                    </p>
                                                    <p className="text-xs text-slate-600 truncate">
                                                        Lead: <span className="font-semibold">{v.leadId}</span> · {v.car}
                                                        {v.rm ? (
                                                            <> · RM {v.rm}</>
                                                        ) : v.status === "SCHEDULED" ? (
                                                            <> · <span className="text-slate-500">RM Pending</span></>
                                                        ) : null}
                                                    </p>
                                                </div>
                                                <Badge className="rounded-xl bg-slate-900 text-white">{statusLabel(v.status)}</Badge>
                                            </div>
                                        ))}

                                        {visibleVisits.length > 20 && (
                                            <div className="text-[11px] text-slate-500 px-1">
                                                Showing first 20 of {visibleVisits.length} visits — scroll to see more.
                                            </div>
                                        )}

                                        {!visibleVisits.length && (
                                            <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-slate-600">
                                                No visits in this view.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-xl border border-dashed bg-white p-4 text-sm text-slate-600">
                                        Visits collapsed.
                                    </div>
                                )}
                            </div>

                            {/* Right: Feedback Radar */}
                            <div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900">Feedback Radar</p>
                                        <div className="flex gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setFeedbackView("HUB")}
                                                className={cx(
                                                    "px-2 py-1 rounded-lg border text-[11px] font-semibold",
                                                    feedbackView === "HUB" ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                                )}
                                            >
                                                Hub
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFeedbackView("RM")}
                                                className={cx(
                                                    "px-2 py-1 rounded-lg border text-[11px] font-semibold",
                                                    feedbackView === "RM" ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                                )}
                                            >
                                                RM
                                            </button>
                                        </div>
                                    </div>

                                    {feedbackView === "HUB" && focusRating !== "ALL" && (
                                        <button
                                            type="button"
                                            onClick={() => setFocusRating("ALL")}
                                            className="text-xs font-semibold text-slate-600 hover:underline"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                                {/* Date Range */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {[
                                        { key: "1D" as const, label: "1 Day" },
                                        { key: "2D" as const, label: "Past 2 Days" },
                                        { key: "7D" as const, label: "Past 7 Days" },
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => setRangeKey(opt.key)}
                                            className={cx(
                                                "rounded-xl border px-3 py-1 text-xs font-semibold",
                                                rangeKey === opt.key ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() => setRangeKey("CUSTOM")}
                                        className={cx(
                                            "rounded-xl border px-3 py-1 text-xs font-semibold",
                                            rangeKey === "CUSTOM" ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                        )}
                                    >
                                        Custom
                                    </button>

                                    <Input
                                        type="date"
                                        value={customStartISO}
                                        onChange={(e) => {
                                            setCustomStartISO(e.target.value);
                                            setRangeKey("CUSTOM");
                                        }}
                                        className="w-[140px] rounded-xl text-xs"
                                        title="Pick start date"
                                    />

                                    <div className="text-[11px] text-slate-500 self-center">
                                        {rangeStartISO} → {dateISO}
                                    </div>
                                </div>

                                {/* Rating Pills: Hub view only */}
                                {feedbackView === "HUB" && (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        {[5, 4, 3, 2, 1].map((r) => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setFocusRating(r as FocusRating)}
                                                className={cx(
                                                    "rounded-xl border px-2 py-2 text-xs font-semibold",
                                                    focusRating === r ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                                )}
                                            >
                                                {r}★ ({ratingCounts[String(r)] ?? 0})
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setFocusRating("NF")}
                                            className={cx(
                                                "rounded-xl border px-2 py-2 text-xs font-semibold",
                                                focusRating === "NF" ? "border-slate-900 bg-slate-50" : "bg-white hover:bg-slate-50"
                                            )}
                                        >
                                            NF ({ratingCounts.NF ?? 0})
                                        </button>
                                    </div>
                                )}

                                {/* Feedback Content */}
                                {feedbackView === "HUB" ? (
                                    <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                        {visibleFeedback
                                            .slice()
                                            .sort((a, b) => (b.dateISO + b.time).localeCompare(a.dateISO + a.time))
                                            .slice(0, 3)
                                            .map((v) => (
                                                <div key={v.id} className="rounded-xl border bg-white p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate">Lead {v.leadId}</p>
                                                            <p className="text-xs text-slate-600 truncate">
                                                                {v.customer}
                                                                {v.rm ? (
                                                                    <> · RM {v.rm}</>
                                                                ) : (
                                                                    <> · <span className="text-slate-500">RM Pending</span></>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <div className="shrink-0 text-right text-sm">
                                                            {typeof v.feedbackRating === "number" ? (
                                                                <span className="inline-flex items-center gap-1 font-semibold">
                                                                    {v.feedbackRating} <Star className="h-4 w-4" />
                                                                </span>
                                                            ) : (
                                                                <span className="font-semibold text-slate-500">NF</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {v.feedbackText ? (
                                                        <p className="mt-2 text-xs text-slate-700">“{v.feedbackText}”</p>
                                                    ) : (
                                                        <p className="mt-2 text-xs text-slate-500">No feedback text</p>
                                                    )}
                                                </div>
                                            ))}

                                        {!visibleFeedback.length && (
                                            <div className="text-xs text-slate-500">No feedback in this view.</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-3 overflow-x-auto">
                                        <table className="w-full text-xs border rounded-xl overflow-hidden">
                                            <thead className="bg-slate-100 text-slate-700">
                                                <tr>
                                                    <th className="text-left px-3 py-2 font-semibold">RM Name</th>
                                                    <th className="text-center px-3 py-2 font-semibold">&lt; 3</th>
                                                    <th className="text-center px-3 py-2 font-semibold">≥ 3</th>
                                                    <th className="text-center px-3 py-2 font-semibold">NF</th>
                                                    <th className="text-center px-3 py-2 font-semibold">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rmAggregated.map((rm) => (
                                                    <tr key={rm.rm} className="border-t">
                                                        <td className="px-3 py-2 font-semibold text-slate-800">{rm.rm}</td>
                                                        <td className="px-3 py-2 text-center text-red-600 font-semibold">{rm.below3}</td>
                                                        <td className="px-3 py-2 text-center text-green-600 font-semibold">{rm.aboveEq3}</td>
                                                        <td className="px-3 py-2 text-center text-slate-600 font-semibold">{rm.nf}</td>
                                                        <td className="px-3 py-2 text-center font-bold">{rm.total}</td>
                                                    </tr>
                                                ))}
                                                {!rmAggregated.length && (
                                                    <tr>
                                                        <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                                                            No RM feedback data.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// --- Lightweight tests for pure helpers (run only in test env) ---
function assert(cond: any, msg: string) {
    if (!cond) throw new Error(msg);
}

if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
    // date math
    assert(addDaysISO("2026-02-11", 0) === "2026-02-11", "addDaysISO +0 failed");
    assert(addDaysISO("2026-02-11", -1) === "2026-02-10", "addDaysISO -1 failed");
    assert(getRangeStartISO("2026-02-11", "1D", "2026-02-01") === "2026-02-11", "range 1D failed");
    assert(getRangeStartISO("2026-02-11", "2D", "2026-02-01") === "2026-02-10", "range 2D failed");
    assert(getRangeStartISO("2026-02-11", "7D", "2026-02-01") === "2026-02-05", "range 7D failed");
    assert(getRangeStartISO("2026-02-11", "CUSTOM", "2026-02-01") === "2026-02-01", "range CUSTOM failed");

    // range check
    assert(inISOInclusiveRange("2026-02-11", "2026-02-11", "2026-02-11"), "inclusive range equality failed");
    assert(inISOInclusiveRange("2026-02-10", "2026-02-10", "2026-02-11"), "inclusive range lower bound failed");
    assert(!inISOInclusiveRange("2026-02-09", "2026-02-10", "2026-02-11"), "inclusive range below failed");

    // lead id
    assert(ensureLeadId("LD-1", 7) === "LD-1", "ensureLeadId should keep existing");
    assert(ensureLeadId("", 7) === "LD-10007", "ensureLeadId should fill when empty");
}
