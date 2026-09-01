with open('src/pages/AttendancePage.tsx', 'r', encoding='utf-8') as f: code = f.read()
code = code.replace(
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";',
    'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";'
)
with open('src/pages/AttendancePage.tsx', 'w', encoding='utf-8') as f: f.write(code)
