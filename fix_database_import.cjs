const fs = require('fs');
const file = 'src/pages/PlatformAdminPage.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(
  'import {\n  Shield, Building2, BarChart3, Settings2, TrendingUp,\n  Users2, CreditCard, Mail, Phone, FileText, UserCircle,\n  Calendar, Globe, ChevronDown, ChevronUp, Hash, MessageSquare,\n  CheckCircle2, IndianRupee, Image as ImageIcon, Trash2, Share2,\n  Search, Filter, Check, Copy, Sparkles, PlusCircle, ArrowUpDown,\n  SlidersHorizontal, UserCheck, RefreshCw, AlertCircle, ExternalLink,\n  Layers, Lock, Unlock, HelpCircle\n} from "lucide-react";',
  'import {\n  Shield, Building2, BarChart3, Settings2, TrendingUp,\n  Users2, CreditCard, Mail, Phone, FileText, UserCircle,\n  Calendar, Globe, ChevronDown, ChevronUp, Hash, MessageSquare,\n  CheckCircle2, IndianRupee, Image as ImageIcon, Trash2, Share2,\n  Search, Filter, Check, Copy, Sparkles, PlusCircle, ArrowUpDown,\n  SlidersHorizontal, UserCheck, RefreshCw, AlertCircle, ExternalLink,\n  Layers, Lock, Unlock, HelpCircle, Database\n} from "lucide-react";'
);
fs.writeFileSync(file, c);
console.log('Fixed Database import');
