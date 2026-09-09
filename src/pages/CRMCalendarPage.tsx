import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, Mail, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CRMCalendarPage() {
  const org = useAppStore((s) => s.organization);
  const [calendarItems, setCalendarItems] = useState<any[]>([]);
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

    // Fetch activities
    const { data: actData } = await (supabase as any)
      .from("activities")
      .select("*, leads(first_name, last_name, company)")
      .eq("org_id", org!.id)
      .gte("due_at", startStr)
      .lte("due_at", endStr);
      
    // Fetch opportunities
    const { data: oppData } = await (supabase as any)
      .from("opportunities")
      .select("*, leads(first_name, last_name, company)")
      .eq("org_id", org!.id)
      .gte("expected_close_date", startStr)
      .lte("expected_close_date", endStr);

    const items: any[] = [];
    
    if (actData) {
      actData.forEach((a: any) => {
        items.push({
          id: `act_${a.id}`,
          type: 'activity',
          date: a.due_at,
          title: a.subject,
          subTitle: a.leads ? `${a.leads.first_name} ${a.leads.last_name}` : '',
          activity_type: a.activity_type,
          status: a.completed_at ? 'completed' : 'open'
        });
      });
    }

    if (oppData) {
      oppData.forEach((o: any) => {
        items.push({
          id: `opp_${o.id}`,
          type: 'opportunity',
          date: o.expected_close_date,
          title: o.title,
          subTitle: o.leads ? `${o.leads.first_name} ${o.leads.last_name}` : '',
          amount: o.amount,
          status: 'open'
        });
      });
    }

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

  const nextPeriod = () => {
    setCurrentDate(prev => viewMode === 'week' ? addWeeks(prev, 1) : addWeeks(prev, 4));
  };

  const prevPeriod = () => {
    setCurrentDate(prev => viewMode === 'week' ? subWeeks(prev, 1) : subWeeks(prev, 4));
  };
  
  const getIcon = (item: any) => {
    if (item.type === 'opportunity') return <DollarSign className="w-3 h-3 mr-1" />;
    switch(item.activity_type) {
      case 'call': return <Phone className="w-3 h-3 mr-1" />;
      case 'email': return <Mail className="w-3 h-3 mr-1" />;
      case 'meeting': return <CalendarIcon className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
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
            <div className="flex items-center rounded-md border border-slate-200 bg-white p-1">
              <button 
                onClick={() => setViewMode('month')} 
                className={`px-3 py-1 text-sm font-medium rounded-sm ${viewMode === 'month' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >Month</button>
              <button 
                onClick={() => setViewMode('week')} 
                className={`px-3 py-1 text-sm font-medium rounded-sm ${viewMode === 'week' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >Week</button>
            </div>
            <Button variant="outline" size="icon" onClick={prevPeriod}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={nextPeriod}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-slate-800 text-center">{format(currentDate, "MMMM yyyy")}</h2>

        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-slate-500 border-r last:border-r-0 border-slate-200">
                {day}
              </div>
            ))}
          </div>
          <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[minmax(120px,auto)]' : 'auto-rows-[minmax(200px,auto)]'} bg-white`}>
            {days.map((day, idx) => {
              const dayItems = calendarItems.filter(a => a.date && isSameDay(parseISO(a.date), day));
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div key={idx} className={`border-r border-b border-slate-100 p-2 min-h-[6rem] ${!isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/50 text-slate-400' : ''}`}>
                  <div className={`text-right text-sm font-medium mb-2 ${isToday(day) ? 'text-blue-600' : ''}`}>
                    <span className={isToday(day) ? 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' : ''}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {dayItems.map(item => (
                      <div key={item.id} className={`p-1.5 rounded-md text-xs border flex items-center justify-between ${
                        item.status === 'completed' ? 'bg-slate-50 border-slate-200 text-slate-500' : 
                        item.type === 'opportunity' ? 'bg-amber-50 border-amber-200 text-amber-700' : 
                        'bg-blue-50 border-blue-200 text-blue-700'
                      }`}>
                        <div className="flex flex-col gap-0.5 truncate w-full">
                          <div className="flex items-center font-medium truncate">
                            {getIcon(item)} {item.title}
                          </div>
                          <div className="truncate opacity-80 text-[10px]">
                            {item.subTitle} {item.amount ? `(₹${item.amount})` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
