import React from 'react';
import { Camera, Settings, Phone, MessageSquare, Chrome, Utensils, Database, Play, Image, Sparkles, CloudSun } from 'lucide-react';

interface AndroidEmulatorHomeProps {
  onLaunchPlateUp: () => void;
  onLaunchCamera: () => void;
  onOpenSettings: () => void;
  onOpenAdminConsole: () => void;
  isAdminRole: boolean;
  currentTime: string;
}

export const AndroidEmulatorHome: React.FC<AndroidEmulatorHomeProps> = ({
  onLaunchPlateUp,
  onLaunchCamera,
  onOpenSettings,
  onOpenAdminConsole,
  isAdminRole,
  currentTime,
}) => {
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="relative flex-1 flex flex-col justify-between p-4 select-none overflow-hidden bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 font-sans">
      {/* Android Wallpaper Graphic Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(16,185,129,0.12),transparent_70%)] pointer-events-none"></div>

      {/* Top: Android "At a Glance" & Clock Widget */}
      <div className="pt-4 px-2 space-y-1">
        <div className="flex items-center justify-between text-stone-300 text-xs px-1">
          <div className="flex items-center gap-1.5">
            <CloudSun size={15} className="text-amber-400" />
            <span className="font-medium text-stone-200">26°C • Sunny</span>
          </div>
          <span className="text-[11px] text-stone-400">{currentDate}</span>
        </div>

        {/* Large Android Material You Clock */}
        <div className="pt-2 text-center">
          <h1 className="text-6xl font-extralight tracking-tighter text-white font-mono drop-shadow-md">
            {currentTime}
          </h1>
        </div>

        {/* Real Android Google Search Bar Pill */}
        <div className="mt-4 mx-auto max-w-[320px] p-2 rounded-full bg-stone-800/90 backdrop-blur-md border border-stone-700 flex items-center justify-between shadow-lg px-4">
          <div className="flex items-center gap-2 text-stone-300">
            <span className="font-extrabold text-sm text-emerald-400">G</span>
            <span className="text-xs text-stone-400">Search apps or web...</span>
          </div>
          <div className="flex items-center gap-2 text-stone-400 text-xs">
            <span>🎙️</span>
            <span>📷</span>
          </div>
        </div>
      </div>

      {/* Middle: Real Android Home Screen App Grid */}
      <div className="my-auto py-3">
        <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-1 text-center">
          {/* THE MAIN APPLICATION: PlateUP (Click to open PlateUP APK) */}
          <button
            onClick={onLaunchPlateUp}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-stone-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-105 transition-transform relative ring-2 ring-emerald-400/50">
              <Utensils size={28} strokeWidth={2.4} />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-stone-900 animate-ping"></span>
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-stone-900"></span>
            </div>
            <span className="text-[11px] font-bold text-white tracking-wide">PlateUP</span>
            <span className="text-[9px] text-emerald-400 font-mono -mt-1 font-semibold">Tap to Open</span>
          </button>

          {/* Android Native Camera */}
          <button
            onClick={onLaunchCamera}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-stone-800 text-emerald-400 border border-stone-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Camera size={26} />
            </div>
            <span className="text-[11px] font-medium text-stone-200">Camera</span>
          </button>

          {/* Android Photos / Gallery */}
          <div className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform opacity-80">
            <div className="w-14 h-14 rounded-2xl bg-stone-800 text-sky-400 border border-stone-700 flex items-center justify-center shadow-md">
              <Image size={24} />
            </div>
            <span className="text-[11px] font-medium text-stone-300">Photos</span>
          </div>

          {/* Android Settings */}
          <button
            onClick={onOpenSettings}
            className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-stone-800 text-stone-300 border border-stone-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Settings size={24} />
            </div>
            <span className="text-[11px] font-medium text-stone-200">Settings</span>
          </button>

          {/* HIDDEN FROM USER: Only visible if Coder / Admin Role is activated */}
          {isAdminRole && (
            <button
              onClick={onOpenAdminConsole}
              className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-transform col-span-4 mt-2"
            >
              <div className="w-full max-w-[280px] p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-2 shadow-lg">
                <Database size={15} />
                <span className="text-xs font-bold font-mono">Reference Console</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Bottom: Android Native App Dock */}
      <div className="pb-2">
        <div className="mx-auto max-w-[340px] p-2 rounded-3xl bg-stone-800/80 backdrop-blur-md border border-stone-700 flex items-center justify-around shadow-2xl">
          {/* Phone Dialer */}
          <div className="w-11 h-11 rounded-2xl bg-emerald-600/30 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Phone size={19} />
          </div>
          {/* Messages */}
          <div className="w-11 h-11 rounded-2xl bg-sky-600/30 text-sky-400 flex items-center justify-center border border-sky-500/20">
            <MessageSquare size={19} />
          </div>
          {/* Chrome */}
          <div className="w-11 h-11 rounded-2xl bg-amber-600/30 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Chrome size={19} />
          </div>
          {/* PlateUP Icon in Dock */}
          <button
            onClick={onLaunchPlateUp}
            className="w-11 h-11 rounded-2xl bg-emerald-500 text-stone-950 flex items-center justify-center shadow-md active:scale-95 transition-transform cursor-pointer border border-emerald-400"
            title="Launch PlateUP"
          >
            <Utensils size={19} />
          </button>
        </div>
      </div>
    </div>
  );
};
