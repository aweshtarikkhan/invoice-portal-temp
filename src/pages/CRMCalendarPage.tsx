import React, { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, Mail, Clock, DollarSign, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarItem {
  id: string;
  type: 'activity' | 'opportunity' | 'lead';
  date: string;
  title: string;
  subTitle: string;
  activity_type?: string;
  amount?: number;
  status: string;
}

function DayPopover({ items, onClose }: { items: CalendarItem[]; onClose: () => void }) {
  return (
    <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-3 w-64 mt-1 left-0 top-full">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-600">{items.length} Event{items.length > 1 ? 's' : ''}</span>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {items.map(item => (
          <div key={item.id} className={`p-2 rounded-lg text-xs border ${
            item.status === 'completed' ? 'bg-slate-50 border-slate-200 text-slate-500' :
            item.type === 'opportunity' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            item.type === 'lead' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center font-semibold gap-1 mb-0.5">
              {item.type === 'opportunity' ? <DollarSign className="w-3 h-3 flex-shrink-0" /> :
               item.type === 'lead' ? <UserPlus className="w-3 h-3 flex-shrink-0" /> :
               item.activity_type === 'call' ? <Phone className="w-3 h-3 flex-shrink-0" /> :
               item.activity_type === 'email' ? <Mail className="w-3 h-3 flex-shrink-0" /> :
               item.activity_type === 'meeting' ? <CalendarIcon className="w-3 h-3 flex-shrink-0" /> :
               <Clock className="w-3 h-3 flex-shrink-0" />}
              <span className="truncate">{item.title}</span>
            </div>
            {item.subTitle && <div className="text-[10px] opacity-70 ml-4">{item.subTitle}</div>}
            {item.amount !== undefined && <div className="text-[10px] ml-4 font-medium">₹{item.amount?.toLocaleString()}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DayCell({ day, items, isCurrentMonth, viewMode }: {
  day: Date;
  items: CalendarItem[];
  isCurrentMonth: boolean;
  viewMode: 'week' | 'month';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const MAX_VISIBLE = viewMode === 'month' ? 2 : 4;
  const visible = items.slice(0, MAX_VISIBLE);
  const extra = items.length - MAX_VISIBLE;

  return (
    <div
      ref={ref}
      className={`relative border-r border-b border-slate-100 p-2 min-h-[6rem] ${
        !isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/50 text-slate-400' : ''
      }`}
    >
      <div className={`text-right text-sm font-medium mb-1.5 ${isToday(day) ? 'text-blue-600' : ''}`}>
        <span className={isToday(day) ? 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' : ''}>
          {format(day, 'd')}
        </span>
      </div>
      <div className="space-y-1">
        {visible.map(item => (
          <div
            key={item.id}
            className={`p-1.5 rounded-md text-xs border truncate flex items-center gap-1 cursor-default ${
              item.status === 'completed' ? 'bg-slate-50 border-slate-200 text-slate-500' :
              item.type === 'opportunity' ? 'bg-amber-50 border-amber-200 text-amber-700' :
              item.type === 'lead' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              'bg-blue-50 border-blue-200 text-blue-700'
            }`}
          >
            {item.type === 'opportunity' ? <DollarSign className="w-2.5 h-2.5 flex-shrink-0" /> :
             item.type === 'lead' ? <UserPlus className="w-2.5 h-2.5 flex-shrink-0" /> :
             item.activity_type === 'call' ? <Phone className="w-2.5 h-2.5 flex-shrink-0" /> :
             item.activity_type === 'email' ? <Mail className="w-2.5 h-2.5 flex-shrink-0" /> :
             <Clock className="w-2.5 h-2.5 flex-shrink-0" />}
            <span className="truncate font-medium">{item.title}</span>
          </div>
        ))}
        {extra > 0 && (
          <button
            onClick={() => setOpen(true)}
            className="w-full text-[10px] text-slate-500 hover:text-blue-600 font-medium text-left px-1 py-0.5 hover:bg-blue-50 rounded"
          >
            +{extra} more...
          </button>
        )}
        {items.length > 0 && extra <= 0 && items.length > 1 && (
          <button
            onClick={() => setOpen(true)}
            className="w-full text-[10px] text-slate-400 hover:text-blue-600 text-left px-1 hover:bg-blue-50 rounded"
          >
            View all
          </button>
        )}
      </div>
      {open && <DayPopover items={items} onClose={() => setOpen(false)} />}
    </div>
  );
}

export default function CRMCalendarPage() {
  const org = useAppStore((s) => s.organization);
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');

  useEffect(() => {
    if (org?.id) fetchCalendarData();
  }, [org?.id, currentDate, viewMode]);

  const fetchCalendarData = async () => {
    setLoading(true);
    let start, end;

    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    const [{ data: actData }, { data: oppData }, { data: leadsData }] = await Promise.all([
      (supabase as any).from("activities").select("*, leads(name, company)").eq("org_id", org!.id).gte("due_at", startStr).lte("due_at", endStr),
      (supabase as any).from("opportunities").select("*, leads(name, company)").eq("org_id", org!.id).gte("expected_close_date", startStr).lte("expected_close_date", endStr),
      (supabase as any).from("leads").select("id, name, company, created_at").eq("org_id", org!.id).gte("created_at", startStr).lte("created_at", endStr),
    ]);

    const items: CalendarItem[] = [];

    (actData || []).forEach((a: any) => {
      items.push({
        id: `act_${a.id}`,
        type: 'activity',
        date: a.due_at,
        title: a.subject || 'Activity',
        subTitle: a.leads?.name || '',
        activity_type: a.activity_type,
        status: a.completed_at ? 'completed' : 'open',
      });
    });

    (oppData || []).forEach((o: any) => {
      items.push({
        id: `opp_${o.id}`,
        type: 'opportunity',
        date: o.expected_close_date,
        title: o.title,
        subTitle: o.leads?.name || '',
        amount: o.amount,
        status: 'open',
      });
    });

    (leadsData || []).forEach((l: any) => {
      items.push({
        id: `lead_${l.id}`,
        type: 'lead',
        date: l.created_at,
        title: `New Lead: ${l.name || 'Unknown'}`,
        subTitle: l.company || '',
        status: 'open',
      });
    });

    setCalendarItems(items);
    setLoading(false);
  };

  const getDays = () => {
    let start, end;
    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }
    return eachDayOfInterval({ start, end });
  };

  const days = getDays();

  return (
    <>
      <div className="flex-1 space-y-6 p-8 bg-slate-50 overflow-y-auto h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Calendar</h1>
            <p className="text-muted-foreground mt-1">Manage your schedule and upcoming CRM tasks.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-xs text-slate-500 mr-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>Lead</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Opportunity</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>Activity</span>
            </div>
            <div className="flex items-center rounded-md border border-slate-200 bg-white p-1">
              <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-sm font-medium rounded-sm ${viewMode === 'month' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Month</button>
              <button onClick={() => setViewMode('week')} className={`px-3 py-1 text-sm font-medium rounded-sm ${viewMode === 'week' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Week</button>
            </div>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subWeeks(prev, 4))}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addWeeks(prev, 4))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-800 text-center">{format(currentDate, "MMMM yyyy")}</h2>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-slate-500 border-r last:border-r-0 border-slate-200">{day}</div>
            ))}
          </div>
          <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[minmax(120px,auto)]' : 'auto-rows-[minmax(200px,auto)]'} bg-white`}>
            {days.map((day, idx) => {
              const dayItems = calendarItems.filter(a => a.date && isSameDay(parseISO(a.date), day));
              return (
                <DayCell
                  key={idx}
                  day={day}
                  items={dayItems}
                  isCurrentMonth={isSameMonth(day, currentDate)}
                  viewMode={viewMode}
                />
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
