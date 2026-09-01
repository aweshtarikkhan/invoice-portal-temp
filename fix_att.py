import re

with open('src/pages/AttendancePage.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. STATUS_OPTIONS
code = re.sub(r'type Status = [\s\S]*?\];', '''type Status = string;

export const STATUS_OPTIONS = [
  { value: "present",    label: "Present",            short: "P",   cls: "bg-green-100 text-green-700 border-green-300", baseStatus: "present" },
  { value: "late",       label: "Late",               short: "L",   cls: "bg-amber-100 text-amber-700 border-amber-300", baseStatus: "late" },
  { value: "half_day",   label: "Half-Day Leave",     short: "HD",  cls: "bg-orange-100 text-orange-700 border-orange-300", baseStatus: "half_day" },
  { value: "absent",     label: "Absent",             short: "AB",  cls: "bg-red-100 text-red-700 border-red-300", baseStatus: "absent" },
  { value: "ncns",       label: "Absent (NCNS)",      short: "NCNS",cls: "bg-red-100 text-red-900 border-red-500", baseStatus: "absent" },
  { value: "lwp",        label: "Leave Without Pay",  short: "LWP", cls: "bg-red-50 text-red-700 border-red-200", baseStatus: "absent" },
  { value: "casual",     label: "Casual Leave (CL)",  short: "CL",  cls: "bg-blue-100 text-blue-700 border-blue-300", baseStatus: "paid_leave" },
  { value: "el_pl",      label: "Earned/Privilege",   short: "PL",  cls: "bg-indigo-100 text-indigo-700 border-indigo-300", baseStatus: "paid_leave" },
  { value: "sick",       label: "Sick/Medical (SL)",  short: "SL",  cls: "bg-amber-100 text-amber-700 border-amber-300", baseStatus: "paid_leave" },
  { value: "comp_off",   label: "Compensatory Off",   short: "CO",  cls: "bg-teal-100 text-teal-700 border-teal-300", baseStatus: "paid_leave" },
  { value: "maternity",  label: "Maternity Leave",    short: "ML",  cls: "bg-pink-100 text-pink-700 border-pink-300", baseStatus: "paid_leave" },
  { value: "paternity",  label: "Paternity Leave",    short: "PTL", cls: "bg-cyan-100 text-cyan-700 border-cyan-300", baseStatus: "paid_leave" },
  { value: "bereavement",label: "Bereavement Leave",  short: "BL",  cls: "bg-slate-100 text-slate-700 border-slate-300", baseStatus: "paid_leave" },
  { value: "marriage",   label: "Marriage Leave",     short: "MRL", cls: "bg-rose-100 text-rose-700 border-rose-300", baseStatus: "paid_leave" },
  { value: "study",      label: "Study/Sabbatical",   short: "STL", cls: "bg-violet-100 text-violet-700 border-violet-300", baseStatus: "paid_leave" },
  { value: "jury_duty",  label: "Jury Duty",          short: "JD",  cls: "bg-stone-100 text-stone-700 border-stone-300", baseStatus: "paid_leave" },
  { value: "od",         label: "On Duty (OD)",       short: "OD",  cls: "bg-sky-100 text-sky-700 border-sky-300", baseStatus: "present" },
  { value: "wfh",        label: "Work From Home",     short: "WFH", cls: "bg-emerald-100 text-emerald-700 border-emerald-300", baseStatus: "present" },
  { value: "holiday",    label: "Holiday",            short: "HO",  cls: "bg-muted text-muted-foreground border-border", baseStatus: "holiday" },
];''', code)

code = re.sub(
    r'\(atts\.data \|\| \[\]\)\.forEach\(\(r: any\) => \{ map\[\$\{r\.employee_id\}\|\$\{r\.attendance_date\}\] = r\.status; \}\);',
    r'(atts.data || []).forEach((r: any) => { map[${r.employee_id}|] = r.override_status || r.status; });',
    code
)

code = re.sub(
    r'\(atts\.data \|\| \[\]\)\.forEach\(\(r: any\) => \{ attMap\[r\.attendance_date\] = r\.status; \}\);',
    r'(atts.data || []).forEach((r: any) => { attMap[r.attendance_date] = r.override_status || r.status; });',
    code
)

code = re.sub(
    r'rows\.push\(\{ org_id: org\.id, employee_id, attendance_date, status \}\);',
    r'const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0]; rows.push({ org_id: org.id, employee_id, attendance_date, status: opt.baseStatus, override_status: opt.value });',
    code
)

with open('src/pages/AttendancePage.tsx', 'w', encoding='utf-8') as f:
    f.write(code)
