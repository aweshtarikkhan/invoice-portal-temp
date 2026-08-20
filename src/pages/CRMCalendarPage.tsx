import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, isToday, addWeeks, subWeeks, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Phone, Mail, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CRMCalendarPage() {
  const { org } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // View mode: 'week' or 'month'
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');

  useEffect(() => {
    if (org?.id) fetchActivities();
  }, [org?.id, currentDate, viewMode]);

  const fetchActivities = async () => {
    setLoading(true);
    let start, end;
    
    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = endOfWeek(currentDate, { weekStartsOn: 1 });
    } else {
      start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
      end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    }

    const { data } = await (supabase as any)
      .from("activities")
      .select("*, leads(first_name, last_name, company)")
      .eq("org_id", org!.id)
      .gte("due_date", start.toISOString())
      .lte("due_date", end.toISOString());
      
    setActivities(data || []);
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
  
  const getActivityIcon = (type: string) => {
    switch(type) {
      case 'call': return <Phone className="w-3 h-3 mr-1" />;
      case 'email': return <Mail className="w-3 h-3 mr-1" />;
      case 'meeting': return <CalendarIcon className="w-3 h-3 mr-1" />;
      default: return <Clock className="w-3 h-3 mr-1" />;
    }
  };

  const days = getDays();

  return (
    <Layout>
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
              const dayActivities = activities.filter(a => isSameDay(parseISO(a.due_date), day));
              const isCurrentMonth = isSameMonth(day, currentDate);
              
              return (
                <div key={idx} className={`border-r border-b border-slate-100 p-2 min-h-24 ${!isCurrentMonth && viewMode === 'month' ? 'bg-slate-50/50 text-slate-400' : ''}`}>
                  <div className={`text-right text-sm font-medium mb-2 ${isToday(day) ? 'text-blue-600' : ''}`}>
                    <span className={isToday(day) ? 'bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full' : ''}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {dayActivities.map(act => (
                      <div key={act.id} className={`p-1.5 rounded-md text-xs border flex items-center justify-between ${act.status === 'completed' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                        <div className="flex flex-col gap-0.5 truncate w-full">
                          <div className="flex items-center font-medium truncate">
                            {getActivityIcon(act.activity_type)} {act.title}
                          </div>
                          <div className="truncate opacity-80 text-[10px]">
                            {act.leads?.first_name} {act.leads?.last_name}
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
    </Layout>
  );
}
