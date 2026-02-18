import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, MapPin, Star, ChevronDown, ChevronUp } from "lucide-react";

/**
 * HUB SUMMARY — UX Designer Revamp ✨
 * Sub-components moved inline for single-file portability if needed,
 * but logically separated.
 */

// ============================================================================
// SHARED UTILS
// ============================================================================
const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
function pad2(n: number) { return String(n).padStart(2, "0"); }
function statusLabel(s: string) { return s.charAt(0) + s.slice(1).toLowerCase(); }
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

// ============================================================================
// SECTION 1: VISITS (ORIGINAL)
// ============================================================================
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
        // ... (Keep existing data generation logic but abbreviated for brevity if unchanged, 
        // but re-inserting full data to ensure it works)
        { leadId: "LD-10021", id: "1", type: "HV", dateISO: d0, time: "10:15", customer: "Amit K.", car: "Swift", rm: "Aman", status: "COMPLETED", feedbackRating: 4, feedbackText: "Good experience" },
        { leadId: "LD-10022", id: "2", type: "HV", dateISO: d0, time: "11:05", customer: "Sandeep R.", car: "Baleno", rm: "Aman", status: "COMPLETED", feedbackRating: 5, feedbackText: "Excellent support" },
        { leadId: "LD-10024", id: "2b", type: "HTD", dateISO: d0, time: "12:10", customer: "Varun T.", car: "Verna", rm: "Neha", status: "COMPLETED", feedbackRating: 3, feedbackText: "Average coordination" },
        { leadId: "LD-10025", id: "2c", type: "HV", dateISO: d0, time: "13:00", customer: "Pooja M.", car: "i10", rm: "Rohit", status: "COMPLETED" },
        { leadId: "LD-10052", id: "3", type: "HV", dateISO: d0, time: "14:10", customer: "Rahul P.", car: "Creta", rm: "Rohit", status: "ONGOING" },
        { leadId: "LD-10036", id: "4", type: "HTD", dateISO: d0, time: "15:00", customer: "Ritika M.", car: "City", status: "SCHEDULED" },
        { leadId: "LD-10040", id: "4b", type: "HV", dateISO: d0, time: "16:20", customer: "Vivek S.", car: "Brezza", status: "CANCELLED" },
        { leadId: "LD-10023", id: "5", type: "HV", dateISO: d1, time: "12:30", customer: "Nikhil P.", car: "i20", rm: "Aman", status: "COMPLETED", feedbackRating: 2, feedbackText: "Delay in arrival" },
        { leadId: "LD-10034", id: "6", type: "HTD", dateISO: d1, time: "12:40", customer: "Diya S.", car: "i20", rm: "Neha", status: "COMPLETED" },
        { leadId: "LD-10041", id: "6b", type: "HV", dateISO: d1, time: "14:00", customer: "Manish G.", car: "Kushaq", rm: "Sahil", status: "COMPLETED", feedbackRating: 5, feedbackText: "Very professional" },
        { leadId: "LD-10042", id: "7", type: "HV", dateISO: d2, time: "10:45", customer: "Rhea S.", car: "Amaze", rm: "Priya", status: "COMPLETED", feedbackRating: 4, feedbackText: "Smooth process" },
        { leadId: "LD-10043", id: "8", type: "HTD", dateISO: d2, time: "15:15", customer: "Arpit N.", car: "Venue", rm: "Aman", status: "COMPLETED", feedbackRating: 1, feedbackText: "Unhappy with demo" },
        { leadId: "LD-10088", id: "9", type: "HV", dateISO: d3, time: "11:20", customer: "Arjun B.", car: "Scorpio", rm: "Sahil", status: "COMPLETED", feedbackRating: 3, feedbackText: "Decent visit" },
        { leadId: "LD-10089", id: "10", type: "HTD", dateISO: d3, time: "16:10", customer: "Megha L.", car: "Amaze", rm: "Priya", status: "COMPLETED", feedbackRating: 1, feedbackText: "Not satisfied" },
        { leadId: "LD-10044", id: "10b", type: "HV", dateISO: d3, time: "17:30", customer: "Saurabh D.", car: "Harrier", rm: "Neha", status: "COMPLETED", feedbackRating: 4, feedbackText: "Good explanation" },
        { leadId: "LD-10045", id: "11", type: "HV", dateISO: d5, time: "09:50", customer: "Kriti A.", car: "Ertiga", rm: "Rohit", status: "COMPLETED", feedbackRating: 5, feedbackText: "Fantastic service" },
        { leadId: "LD-10046", id: "12", type: "HTD", dateISO: d5, time: "13:40", customer: "Aditya V.", car: "Altroz", rm: "Sahil", status: "COMPLETED" },
        { leadId: "LD-10090", id: "13", type: "HV", dateISO: d6, time: "10:40", customer: "Kunal R.", car: "Creta", rm: "Neha", status: "COMPLETED", feedbackRating: 4, feedbackText: "Smooth" },
        { leadId: "LD-10091", id: "14", type: "HTD", dateISO: d6, time: "13:00", customer: "Deepak S.", car: "Fortuner", rm: "Priya", status: "COMPLETED" },
    ];
}


// ============================================================================
// SECTION 2: HTD CONTROL TOWER
// ============================================================================
type HTDStage = "upcoming" | "ongoing" | "cancelled" | "completed";
type CallStatus = "yes" | "no" | "late" | "na";
type RMStatus = "Idle" | "At Hub" | "Driving" | "Checked-out" | "At Customer" | "Returning" | "Visit Running";
type TokenStatus = "yes" | "no";

type HTDRow = {
    leadId: string;
    customerName: string;
    rmName: string;
    slot: string; // HH:MM
    stage: HTDStage;
    call?: CallStatus;
    rmStatus?: RMStatus;
    travelMins?: number;
    estTravelMins?: number;
    checkoutTime?: string | null;
    checkinTime?: string | null;
    reachCustomerMins?: number | null;
    returnToHubMins?: number | null;
    visitDurationMins?: number | null;
    idleButLateCheckout?: boolean | null;
    etaBackToHub?: string | null;
    estTotalMins?: number | null;
    actualMins?: number | null;
    token?: TokenStatus;
    feedbackRating?: 1 | 2 | 3 | 4 | 5 | null;
    didFollowUp?: boolean | null;
    cancelReason?: string;
    notes?: string;
};

const HTD_DEMO: HTDRow[] = [
    { leadId: "LD-2001", customerName: "Priya", rmName: "Aman Sharma", rmStatus: "At Hub", slot: "17:00", travelMins: 30, call: "na", stage: "upcoming", notes: "Customer prefers call 30 mins before slot." },
    { leadId: "LD-2002", customerName: "Karan", rmName: "Chetan Arora", rmStatus: "Checked-out", slot: "19:00", travelMins: 40, call: "yes", stage: "upcoming" },
    { leadId: "LD-2003", customerName: "Ananya", rmName: "Badal Rajpoot", rmStatus: "Idle", slot: "20:30", travelMins: 25, call: "na", stage: "upcoming" },
    { leadId: "LD-2004", customerName: "Rohit", rmName: "Aman Sharma", rmStatus: "Driving", slot: "21:00", travelMins: 20, call: "yes", stage: "upcoming" },
    { leadId: "LD-3001", customerName: "Ritik", rmName: "Aman Sharma", slot: "13:00", call: "yes", stage: "ongoing", estTravelMins: 22, checkoutTime: "12:18", reachCustomerMins: 24, checkinTime: null, returnToHubMins: null, visitDurationMins: 48, idleButLateCheckout: true, etaBackToHub: "14:40", notes: "Visit running; customer asked for extra photos." },
    { leadId: "LD-3002", customerName: "Sahil Verma", rmName: "Mehul Singh", slot: "15:00", call: "late", stage: "ongoing", estTravelMins: 35, checkoutTime: "14:40", reachCustomerMins: 38, checkinTime: null, returnToHubMins: null, visitDurationMins: 12, idleButLateCheckout: false, etaBackToHub: "16:25" },
    { leadId: "LD-1001", customerName: "Nikhil", rmName: "Aman Sharma", slot: "12:00", call: "no", stage: "cancelled", didFollowUp: null, cancelReason: "", notes: "Customer unreachable; HM to confirm follow-up." },
    { leadId: "LD-1002", customerName: "Shreya", rmName: "Mehul Singh", slot: "18:00", call: "yes", stage: "cancelled", didFollowUp: true, cancelReason: "Customer rescheduled to tomorrow." },
    { leadId: "LD-4001", customerName: "Neeraj", rmName: "Chetan Arora", slot: "10:00", call: "yes", stage: "completed", estTotalMins: 75, actualMins: 82, token: "yes", feedbackRating: 5 },
    { leadId: "LD-4002", customerName: "Simran", rmName: "Badal Rajpoot", slot: "11:00", call: "late", stage: "completed", estTotalMins: 60, actualMins: 58, token: "no", feedbackRating: 3, notes: "Token missed; feedback captured." },
];

function toMins(hhmm: string) {
    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
    return h * 60 + m;
}

function fromMins(total: number) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
}

const DEMO_NOW = "16:30";

function getNeedsAttentionUpcoming(rows: HTDRow[]) {
    const now = toMins(DEMO_NOW);
    return rows
        .filter((r) => r.stage === "upcoming" && (r.travelMins ?? 0) > 0)
        .filter((r) => {
            const latestLeave = toMins(r.slot) - (r.travelMins ?? 0);
            const hasCheckoutSignal = r.rmStatus === "Driving" || r.rmStatus === "Checked-out";
            return now >= latestLeave && !hasCheckoutSignal;
        })
        .sort((a, b) => toMins(a.slot) - toMins(b.slot));
}

function Pill({ tone, children }: React.PropsWithChildren<{ tone: "ok" | "warn" | "muted" | "bad" }>) {
    const map = {
        ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warn: "bg-amber-50 text-amber-800 border-amber-200",
        muted: "bg-slate-50 text-slate-600 border-slate-200",
        bad: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return <span className={cx("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", map[tone])}>{children}</span>;
}

// ============================================================================
// SECTION 3: RM LIVE PRODUCTIVITY
// ============================================================================
type Activity = "HV" | "HTD" | "IDLE";
type ScheduleItem = { at: string; type: Activity; state: "done" | "ongoing" | "upcoming"; leadId: string; durationMin?: number; };
type RM = {
    id: string; name: string; now: Activity; customer?: string; currentLeadId?: string; startedAt: string; frc: string; frcAvgMTD?: string; location: string;
    visitsToday: number; tokensToday: number; deliveriesToday: number; feedbackFilledToday: number;
    visitsMTD: number; tokensMTD: number; deliveriesMTD: number; feedbackFilledMTD: number; schedule: ScheduleItem[];
};

export function minutesBetween(aISO: string, bISO: string) {
    const a = new Date(aISO);
    const b = new Date(bISO);
    return Math.max(0, Math.floor((b.getTime() - a.getTime()) / 60000));
}

export function fmtTime(ts: string) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function fmtRuntime(mins: number) {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function toMinutesFromHHMM(hhmm: string) {
    const [hhStr, mmStr] = hhmm.split(":");
    return Number(hhStr) * 60 + Number(mmStr);
}

function toHHMMFromMinutes(totalMinutes: number) {
    const m = ((totalMinutes % 1440) + 1440) % 1440;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function avgHHMM(values: string[]) {
    if (!values.length) return "00:00";
    const sum = values.reduce((acc, v) => acc + toMinutesFromHHMM(v), 0);
    return toHHMMFromMinutes(Math.round(sum / values.length));
}

function minISOByTime(isos: string[]) {
    if (!isos.length) return "";
    return [...isos].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
}

const RM_DEMO: RM[] = [
    { id: "1", name: "Mehul Singh", now: "IDLE", startedAt: "2026-02-11T12:25:00", frc: "2026-02-11T09:45:00", frcAvgMTD: "09:35", location: "Hub", visitsToday: 1, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 0, visitsMTD: 26, tokensMTD: 8, deliveriesMTD: 3, feedbackFilledMTD: 14, schedule: [{ at: "10:00", type: "HV", state: "done", leadId: "LD-98321", durationMin: 40 }, { at: "11:00", type: "HV", state: "done", leadId: "LD-98345", durationMin: 35 }] },
    { id: "2", name: "Chetan Arora", now: "HV", customer: "Gopy Ram", currentLeadId: "LD-77290", startedAt: "2026-02-11T12:12:00", frc: "2026-02-11T09:05:00", frcAvgMTD: "09:18", location: "Hub", visitsToday: 2, tokensToday: 1, deliveriesToday: 0, feedbackFilledToday: 1, visitsMTD: 43, tokensMTD: 15, deliveriesMTD: 6, feedbackFilledMTD: 28, schedule: [{ at: "10:00", type: "HV", state: "done", leadId: "LD-77211", durationMin: 50 }, { at: "12:12", type: "HV", state: "ongoing", leadId: "LD-77290" }, { at: "13:10", type: "HTD", state: "upcoming", leadId: "LD-77310" }] },
    { id: "3", name: "Badal Rajpoot", now: "HV", customer: "Satyan", currentLeadId: "LD-66544", startedAt: "2026-02-11T11:55:00", frc: "2026-02-11T09:10:00", frcAvgMTD: "09:22", location: "Hub", visitsToday: 2, tokensToday: 0, deliveriesToday: 0, feedbackFilledToday: 0, visitsMTD: 55, tokensMTD: 18, deliveriesMTD: 7, feedbackFilledMTD: 30, schedule: [{ at: "10:00", type: "HV", state: "done", leadId: "LD-66501", durationMin: 45 }, { at: "11:55", type: "HV", state: "ongoing", leadId: "LD-66544" }] },
    { id: "4", name: "Neeraj Verma", now: "HTD", customer: "Ankit Yadav", currentLeadId: "LD-55290", startedAt: "2026-02-11T10:45:00", frc: "2026-02-11T08:55:00", frcAvgMTD: "09:08", location: "At Customer", visitsToday: 3, tokensToday: 2, deliveriesToday: 1, feedbackFilledToday: 2, visitsMTD: 72, tokensMTD: 30, deliveriesMTD: 15, feedbackFilledMTD: 40, schedule: [{ at: "09:30", type: "HV", state: "done", leadId: "LD-55221", durationMin: 35 }, { at: "10:45", type: "HTD", state: "ongoing", leadId: "LD-55290" }, { at: "13:20", type: "HTD", state: "upcoming", leadId: "LD-55310" }] },
    { id: "5", name: "Aman Sharma", now: "HTD", customer: "Ritik", currentLeadId: "LD-44205", startedAt: "2026-02-11T12:05:00", frc: "2026-02-11T09:20:00", frcAvgMTD: "09:25", location: "On Route", visitsToday: 4, tokensToday: 2, deliveriesToday: 1, feedbackFilledToday: 2, visitsMTD: 86, tokensMTD: 35, deliveriesMTD: 18, feedbackFilledMTD: 55, schedule: [{ at: "10:00", type: "HV", state: "done", leadId: "LD-44111", durationMin: 55 }, { at: "11:10", type: "HTD", state: "done", leadId: "LD-44180", durationMin: 80 }, { at: "12:05", type: "HTD", state: "ongoing", leadId: "LD-44205" }] }
];


// ============================================================================
// COMPONENT
// ============================================================================
export default function HubSummaryDesignerRevamp() {
    // ----- STATE: MAIN DASHBOARD -----
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
    const visits = useMemo(() => visitsRaw.map((v, i) => ({ ...v, leadId: ensureLeadId(v.leadId, i) })), [visitsRaw]);
    const scoped = useMemo(() => scope === "ALL" ? visits : visits.filter((v) => v.type === scope), [scope, visits]);
    const counts = useMemo(() => ({
        total: scoped.length,
        completed: scoped.filter((v) => v.status === "COMPLETED").length,
        ongoing: scoped.filter((v) => v.status === "ONGOING").length,
        scheduled: scoped.filter((v) => v.status === "SCHEDULED").length,
        cancelled: scoped.filter((v) => v.status === "CANCELLED").length,
    }), [scoped]);

    const visibleVisits = useMemo(() => {
        const list = focusStatus === "ALL" ? scoped : scoped.filter((v) => v.status === focusStatus);
        return list.slice().sort((a, b) => (a.time + a.id).localeCompare(b.time + b.id));
    }, [scoped, focusStatus]);

    const rangeStartISO = useMemo(() => getRangeStartISO(dateISO, rangeKey, customStartISO), [dateISO, rangeKey, customStartISO]);
    const completedInRange = useMemo(() => scoped.filter((v) => v.status === "COMPLETED" && inISOInclusiveRange(v.dateISO, rangeStartISO, dateISO)), [scoped, rangeStartISO, dateISO]);
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
        return Object.entries(map).map(([rm, d]) => ({ rm, ...d })).sort((a, b) => b.total - a.total);
    }, [completedInRange]);


    // ----- STATE: HTD TOWER -----
    const [htdFilter, setHtdFilter] = useState<HTDStage>("upcoming");
    const [selectedHTD, setSelectedHTD] = useState<HTDRow | null>(null);
    const [htdOverrides, setHtdOverrides] = useState<Record<string, Partial<HTDRow>>>({});

    const htdWithOverrides = useMemo(() => HTD_DEMO.map((r) => ({ ...r, ...(htdOverrides[r.leadId] ?? {}) })), [htdOverrides]);
    const htdFiltered = htdWithOverrides.filter((r) => r.stage === htdFilter);
    const htdAttention = getNeedsAttentionUpcoming(htdWithOverrides);
    const htdCounts = useMemo(() => {
        const base: Record<HTDStage, number> = { upcoming: 0, ongoing: 0, cancelled: 0, completed: 0 };
        for (const r of htdWithOverrides) base[r.stage] += 1;
        return base;
    }, [htdWithOverrides]);


    // ----- STATE: RM PRODUCTIVITY -----
    const [openRM, setOpenRM] = useState<RM | null>(null);
    const rmComputed = useMemo(() => {
        const nowISO_RM = "2026-02-11T12:40:00"; // Frozen demo time
        return RM_DEMO.map((rm) => {
            const runtime = minutesBetween(rm.startedAt, nowISO_RM);
            const minutesSinceFRC = minutesBetween(rm.frc, nowISO_RM);
            const busyMinutesDone = rm.schedule.filter((s) => s.state === "done").reduce((acc, s) => acc + (s.durationMin || 0), 0);
            const busyMinutesOngoing = rm.now !== "IDLE" ? runtime : 0;
            const utilRate = minutesSinceFRC ? Math.round(((busyMinutesDone + busyMinutesOngoing) / minutesSinceFRC) * 100) : 0;
            return { ...rm, runtime, utilRate, hvCount: rm.schedule.filter(s => s.type === "HV" && s.state === "done").length, htdCount: rm.schedule.filter(s => s.type === "HTD" && s.state === "done").length, nextHTD: rm.schedule.find(s => s.type === "HTD" && s.state === "upcoming") };
        }).sort((a, b) => a.utilRate - b.utilRate);
    }, []);

    const openHub = () => {
        const nowISO_RM = "2026-02-11T12:40:00";
        setOpenRM({
            id: "HUB", name: "Hub View — All RMs", now: "IDLE", startedAt: nowISO_RM, frc: minISOByTime(rmComputed.map(r => r.frc)) || nowISO_RM, frcAvgMTD: avgHHMM(rmComputed.map(r => r.frcAvgMTD || fmtTime(r.frc))), location: "—",
            visitsToday: rmComputed.reduce((a, r) => a + r.visitsToday, 0), tokensToday: rmComputed.reduce((a, r) => a + r.tokensToday, 0), deliveriesToday: rmComputed.reduce((a, r) => a + r.deliveriesToday, 0), feedbackFilledToday: rmComputed.reduce((a, r) => a + r.feedbackFilledToday, 0),
            visitsMTD: rmComputed.reduce((a, r) => a + r.visitsMTD, 0), tokensMTD: rmComputed.reduce((a, r) => a + r.tokensMTD, 0), deliveriesMTD: rmComputed.reduce((a, r) => a + r.deliveriesMTD, 0), feedbackFilledMTD: rmComputed.reduce((a, r) => a + r.feedbackFilledMTD, 0), schedule: []
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
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
                        <Input type="date" value={dateISO} onChange={(e) => { setDateISO(e.target.value); setCustomStartISO(e.target.value); }} className="w-[160px]" />
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-6 space-y-10">

                {/* =======================
            PART 1: VISITS & FEEDBACK
           ======================= */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-900">1. Daily Overview & Feedback</h2>
                    </div>
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex gap-2">
                                {(["ALL", "HV", "HTD"] as Scope[]).map((t) => (
                                    <button key={t} onClick={() => setScope(t)} className={cx("px-4 py-2 rounded-xl border text-sm font-semibold transition-colors", scope === t ? "bg-slate-900 text-white" : "bg-white hover:bg-slate-50")}>{t}</button>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* KPIs */}
                            <div className="grid grid-cols-5 gap-3">
                                {[
                                    { key: "ALL" as const, label: "Total", value: counts.total, collapsible: true },
                                    { key: "COMPLETED" as const, label: "Completed", value: counts.completed },
                                    { key: "ONGOING" as const, label: "Ongoing", value: counts.ongoing },
                                    { key: "SCHEDULED" as const, label: "Scheduled", value: counts.scheduled },
                                    { key: "CANCELLED" as const, label: "Cancelled", value: counts.cancelled },
                                ].map((k) => (
                                    <button key={k.key} onClick={() => { if (k.collapsible) { setVisitsOpen((v) => !v); setFocusStatus("ALL"); } else { setFocusStatus(k.key as FocusStatus); setVisitsOpen(true); } }} className={cx("rounded-xl border p-3 text-left transition bg-white", focusStatus === k.key ? "ring-2 ring-slate-900 ring-offset-2" : "hover:bg-slate-50")}>
                                        <p className="text-xs text-slate-600 font-semibold">{k.label}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-2xl font-bold text-slate-900">{k.value}</p>
                                            {k.collapsible && <span className="text-slate-600">{visitsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <Separator className="my-6" />

                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Visits List */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">Today’s Visits</p>
                                        {focusStatus !== "ALL" && <button onClick={() => setFocusStatus("ALL")} className="text-xs font-semibold text-slate-600 hover:underline">Clear filter</button>}
                                    </div>
                                    {visitsOpen ? (
                                        <div className="mt-3 space-y-2 max-h-[520px] overflow-y-auto pr-1">
                                            {visibleVisits.length > 0 ? visibleVisits.slice(0, 20).map((v) => (
                                                <div key={v.id} className="rounded-xl border bg-white p-3 flex items-start justify-between">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-slate-900 truncate">{v.time} · {v.customer}</p>
                                                        <p className="text-xs text-slate-600 truncate">Lead: <span className="font-semibold">{v.leadId}</span> · {v.car} {v.rm ? <> · RM {v.rm}</> : v.status === "SCHEDULED" ? <> · <span className="text-slate-500">RM Pending</span></> : null}</p>
                                                    </div>
                                                    <Badge className="rounded-xl bg-slate-900 text-white">{statusLabel(v.status)}</Badge>
                                                </div>
                                            )) : <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-slate-600">No visits in this view.</div>}
                                        </div>
                                    ) : <div className="mt-3 rounded-xl border border-dashed bg-white p-4 text-sm text-slate-600">Visits collapsed.</div>}
                                </div>

                                {/* Feedback Radar */}
                                <div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-slate-900">Feedback Radar</p>
                                        <div className="flex gap-1">
                                            <button onClick={() => setFeedbackView("HUB")} className={cx("px-2 py-1 rounded-lg border text-[11px] font-semibold", feedbackView === "HUB" ? "bg-slate-100" : "bg-white")}>Hub</button>
                                            <button onClick={() => setFeedbackView("RM")} className={cx("px-2 py-1 rounded-lg border text-[11px] font-semibold", feedbackView === "RM" ? "bg-slate-100" : "bg-white")}>RM</button>
                                        </div>
                                    </div>
                                    {feedbackView === "HUB" && focusRating !== "ALL" && <button onClick={() => setFocusRating("ALL")} className="text-xs font-semibold text-slate-600 hover:underline mt-1">Clear rating filter</button>}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {[{ key: "1D", label: "1 Day" }, { key: "2D", label: "2 Days" }, { key: "7D", label: "7 Days" }].map((opt) => (
                                            <button key={opt.key} onClick={() => setRangeKey(opt.key as any)} className={cx("rounded-xl border px-3 py-1 text-xs font-semibold", rangeKey === opt.key ? "bg-slate-900 text-white" : "bg-white")}>{opt.label}</button>
                                        ))}
                                        <input type="date" value={customStartISO} onChange={(e) => { setCustomStartISO(e.target.value); setRangeKey("CUSTOM"); }} className="border rounded-xl px-2 text-xs w-[110px]" />
                                    </div>

                                    {feedbackView === "HUB" && (
                                        <div className="mt-3 grid grid-cols-3 gap-2">
                                            {[5, 4, 3, 2, 1, "NF"].map((r) => (
                                                <button key={r} onClick={() => setFocusRating(r as FocusRating)} className={cx("rounded-xl border px-2 py-2 text-xs font-semibold", focusRating === r ? "bg-slate-900 text-white" : "bg-white")}>{r}{typeof r === 'number' && '★'} ({ratingCounts[String(r)] ?? 0})</button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                                        {feedbackView === "HUB" ? (
                                            visibleFeedback.length > 0 ? visibleFeedback.slice(0, 5).map((v) => (
                                                <div key={v.id} className="rounded-xl border bg-white p-3">
                                                    <div className="flex justify-between">
                                                        <div className="text-xs font-semibold">{v.leadId}</div>
                                                        <div className="text-xs font-bold">{typeof v.feedbackRating === 'number' ? <span className="flex items-center gap-1">{v.feedbackRating}<Star className="h-3 w-3" /></span> : 'NF'}</div>
                                                    </div>
                                                    <div className="text-xs text-slate-600 mt-1">{v.customer} · {v.rm ?? "Unassigned"}</div>
                                                    {v.feedbackText && <div className="text-xs italic text-slate-500 mt-1">“{v.feedbackText}”</div>}
                                                </div>
                                            )) : <div className="text-xs text-slate-500">No feedback found.</div>
                                        ) : (
                                            <table className="w-full text-xs border rounded-xl overflow-hidden">
                                                <thead className="bg-slate-100"><tr><th className="px-2 py-1 text-left">RM</th><th className="px-2 py-1 text-center text-red-600">&lt;3</th><th className="px-2 py-1 text-center text-green-600">≥3</th><th className="px-2 py-1 text-center">NF</th><th className="px-2 py-1 text-center">T</th></tr></thead>
                                                <tbody>
                                                    {rmAggregated.map((rm) => (
                                                        <tr key={rm.rm} className="border-t"><td className="px-2 py-1 font-semibold">{rm.rm}</td><td className="px-2 py-1 text-center text-red-600">{rm.below3}</td><td className="px-2 py-1 text-center text-green-600">{rm.aboveEq3}</td><td className="px-2 py-1 text-center text-slate-500">{rm.nf}</td><td className="px-2 py-1 text-center font-bold">{rm.total}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>


                {/* =======================
            PART 2: HTD CONTROL TOWER
           ======================= */}
                <section>
                    <h2 className="text-base font-bold text-slate-900 mb-4">2. HTD Control Tower</h2>
                    <Card className="rounded-2xl shadow-sm border-slate-200">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-slate-500">Live Status: <span className="font-semibold text-slate-900">{DEMO_NOW}</span></div>
                                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                    {([{ k: "upcoming", l: "Upcoming" }, { k: "ongoing", l: "Ongoing" }, { k: "cancelled", l: "Cancelled" }, { k: "completed", l: "Completed" }] as any[]).map((t) => (
                                        <button key={t.k} onClick={() => setHtdFilter(t.k)} className={cx("px-3 py-1 rounded-md text-xs font-semibold", htdFilter === t.k ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-900")}>
                                            {t.l} <span className="ml-1 opacity-60">({htdCounts[t.k as HTDStage]})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {htdFilter === "upcoming" && (
                                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <div className="text-xs font-bold text-amber-800 mb-2">NEEDS ATTENTION ({htdAttention.length})</div>
                                    {htdAttention.length === 0 ? <span className="text-xs text-amber-700">All good.</span> : (
                                        <div className="space-y-1">
                                            {htdAttention.map(r => (
                                                <div key={r.leadId} className="flex justify-between text-xs bg-white/40 p-1 rounded">
                                                    <span className="font-semibold text-amber-900">{r.slot} · {r.customerName}</span>
                                                    <span className="text-amber-800">Travel {r.travelMins}m · Leave by {fromMins(toMins(r.slot) - (r.travelMins || 0))}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 text-slate-500 font-medium">
                                        <tr>
                                            {/* DYNAMIC COLUMNS BASED ON FILTER */}
                                            <th className="px-3 py-2 text-left">Lead</th>
                                            <th className="px-3 py-2 text-left">Cust</th>
                                            <th className="px-3 py-2 text-left">RM</th>
                                            <th className="px-3 py-2 text-left">Slot</th>
                                            <th className="px-3 py-2 text-left">Call</th>
                                            {htdFilter === "upcoming" && <th className="px-3 py-2 text-left">Travel</th>}
                                            {htdFilter === "ongoing" && <><th className="px-3 py-2 text-left">Checkout</th><th className="px-3 py-2 text-left">ETA Back</th></>}
                                            {htdFilter === "cancelled" && <th className="px-3 py-2 text-left">Reason</th>}
                                            {htdFilter === "completed" && <th className="px-3 py-2 text-left">Token</th>}
                                            <th className="px-3 py-2 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {htdFiltered.map((r) => (
                                            <tr key={r.leadId} className="hover:bg-slate-50">
                                                <td className="px-3 py-2 font-semibold">{r.leadId}</td>
                                                <td className="px-3 py-2">{r.customerName}</td>
                                                <td className="px-3 py-2"><Pill tone="ok">{r.rmName}</Pill></td>
                                                <td className="px-3 py-2 font-semibold">{r.slot}</td>
                                                <td className="px-3 py-2"><Pill tone={r.call === 'yes' ? 'ok' : r.call === 'no' ? 'bad' : 'warn'}>{r.call?.toUpperCase()}</Pill></td>
                                                {htdFilter === "upcoming" && <td className="px-3 py-2">{r.travelMins}m</td>}
                                                {htdFilter === "ongoing" && <td className="px-3 py-2">{r.checkoutTime}</td>}
                                                {htdFilter === "ongoing" && <td className="px-3 py-2">{r.etaBackToHub}</td>}
                                                {htdFilter === "cancelled" && <td className="px-3 py-2 max-w-[150px] truncate">{r.cancelReason || '—'}</td>}
                                                {htdFilter === "completed" && <td className="px-3 py-2"><Pill tone={r.token === 'yes' ? 'ok' : 'bad'}>{r.token?.toUpperCase()}</Pill></td>}
                                                <td className="px-3 py-2 text-right"><button onClick={() => setSelectedHTD(r)} className="text-blue-600 font-semibold hover:underline">View</button></td>
                                            </tr>
                                        ))}
                                        {htdFiltered.length === 0 && <tr><td colSpan={10} className="px-3 py-4 text-center text-slate-500">No rows found.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </section>


                {/* =======================
            PART 3: RM LIVE PRODUCTIVITY
           ======================= */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-900">3. RM Live Productivity</h2>
                        <button onClick={openHub} className="bg-white border text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-slate-50 flex items-center gap-1">⧉ Hub View</button>
                    </div>

                    <div className="flex gap-6">
                        <Card className="flex-1 rounded-2xl shadow-sm border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-600">RM Name</th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Current Activity</th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Runtime</th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Productivity</th>
                                            <th className="px-4 py-3 text-left font-semibold text-slate-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rmComputed.map(rm => (
                                            <tr key={rm.id} className="group hover:bg-slate-50">
                                                <td className="px-4 py-3 font-semibold text-slate-900">{rm.name}</td>
                                                <td className="px-4 py-3">
                                                    <Badge className="mr-2 bg-slate-100 text-slate-800 hover:bg-slate-200">{rm.now}</Badge>
                                                    <span className="text-slate-600">{rm.customer || '—'}</span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{fmtRuntime(rm.runtime)}</td>
                                                <td className="px-4 py-3">
                                                    <span className={cx("font-bold", rm.utilRate < 40 ? "text-red-600" : "text-emerald-600")}>{rm.utilRate}% Util</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button onClick={() => setOpenRM(rm as any)} className="text-blue-600 font-semibold hover:underline">Drilldown</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        {/* Placeholder for right side provided in request but kept empty/placeholder for layout fidelity */}
                        <div className="w-1/3 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-sm">
                            Other Metrics / Funnel
                        </div>
                    </div>
                </section>

            </div>

            {/* DIALOGS */}

            {/* HTD Detail Modal */}
            <Dialog open={!!selectedHTD} onOpenChange={(v) => !v && setSelectedHTD(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader><DialogTitle>{selectedHTD?.customerName}</DialogTitle></DialogHeader>
                    {selectedHTD && (
                        <div className="space-y-4 text-sm mt-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2 bg-slate-50 rounded border">Lead: <span className="font-semibold">{selectedHTD.leadId}</span></div>
                                <div className="p-2 bg-slate-50 rounded border">Slot: <span className="font-semibold">{selectedHTD.slot}</span></div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold">Notes</label>
                                <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 min-h-[60px]">{selectedHTD.notes || 'No notes.'}</p>
                            </div>
                            {selectedHTD.stage === 'cancelled' && (
                                <div>
                                    <label className="text-xs font-semibold block mb-1">Reason</label>
                                    <textarea
                                        className="w-full border rounded p-2 text-xs"
                                        value={selectedHTD.cancelReason || ''}
                                        onChange={(e) => setHtdOverrides(p => ({ ...p, [selectedHTD.leadId]: { ...(p[selectedHTD.leadId] || {}), cancelReason: e.target.value } }))}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* RM Detail Modal */}
            <Dialog open={!!openRM} onOpenChange={(v) => !v && setOpenRM(null)}>
                <DialogContent className="max-w-2xl bg-slate-50 max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{openRM?.name} Snapshot</DialogTitle></DialogHeader>
                    {openRM && (
                        <div className="space-y-4 text-sm mt-2">
                            {/* 1. Summary */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-3">Today's Performance</h4>
                                <div className="grid grid-cols-4 gap-4 text-center">
                                    <div className="p-2 border rounded-lg"><div className="text-xs text-slate-500">Visits</div><div className="font-bold text-lg">{openRM.visitsToday}</div><div className="text-[10px] text-slate-400">MTD {openRM.visitsMTD}</div></div>
                                    <div className="p-2 border rounded-lg"><div className="text-xs text-slate-500">Tokens</div><div className="font-bold text-lg">{openRM.tokensToday}</div><div className="text-[10px] text-slate-400">MTD {openRM.tokensMTD}</div></div>
                                    <div className="p-2 border rounded-lg"><div className="text-xs text-slate-500">Deliv</div><div className="font-bold text-lg">{openRM.deliveriesToday}</div><div className="text-[10px] text-slate-400">MTD {openRM.deliveriesMTD}</div></div>
                                    <div className="p-2 border rounded-lg"><div className="text-xs text-slate-500">Feedbk</div><div className="font-bold text-lg">{openRM.feedbackFilledToday}</div><div className="text-[10px] text-slate-400">MTD {openRM.feedbackFilledMTD}</div></div>
                                </div>
                                <div className="mt-4 flex justify-between items-center text-xs border-t pt-3">
                                    <span className="text-slate-500">Avg FRC (MTD): <span className="font-mono font-semibold text-slate-700">{openRM.frcAvgMTD}</span></span>
                                    <span className="text-slate-500">Today FRC: <span className="font-mono font-semibold text-slate-700">{fmtTime(openRM.frc)}</span></span>
                                </div>
                            </div>

                            {/* 2. Timeline */}
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-3">Timeline</h4>
                                {openRM.schedule.length === 0 ? <p className="text-xs text-slate-400 italic">No activity recorded.</p> : (
                                    <div className="space-y-2">
                                        {openRM.schedule.map((s, i) => (
                                            <div key={i} className="flex gap-3 text-xs border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                                                <div className="font-mono font-semibold text-slate-500 w-[40px]">{s.at}</div>
                                                <div>
                                                    <span className={cx("font-bold px-1.5 py-0.5 rounded text-[10px]", s.type === 'HTD' ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800")}>{s.type}</span>
                                                    <span className="mx-2 text-slate-700">{s.leadId}</span>
                                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px]">{s.state}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    );
}
