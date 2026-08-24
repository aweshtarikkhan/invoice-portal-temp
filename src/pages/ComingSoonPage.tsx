import React from "react";
import { Hammer, Sparkles } from "lucide-react";

export default function ComingSoonPage({ title, description }: { title?: string, description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
        <div className="h-24 w-24 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 relative z-10">
          <Hammer className="h-10 w-10 text-indigo-400" />
        </div>
        <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 animate-pulse z-20" />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">
        {title || "Coming Soon"}
      </h1>
      
      <p className="text-slate-400 max-w-md text-lg">
        {description || "We are working hard to bring you this feature. Stay tuned for exciting updates in our upcoming releases!"}
      </p>
      
      <div className="mt-8 flex gap-3">
        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
