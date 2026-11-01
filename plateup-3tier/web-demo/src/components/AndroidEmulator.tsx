import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryMedium,
  Power,
  Volume2,
  VolumeX,
  RotateCw,
  Camera,
  Smartphone,
  ChevronLeft,
  Circle,
  Square,
  Shield,
  Terminal,
  Database,
  Info,
} from 'lucide-react';

interface AndroidEmulatorProps {
  children: React.ReactNode;
  isScreenOn: boolean;
  onTogglePower: () => void;
  isUnlocked: boolean;
  onUnlock: () => void;
  isAppOpen: boolean;
  onLaunchApp: () => void;
  onHomePress: () => void;
  onBackPress: () => void;
  isAdminRole: boolean;
  onToggleAdminRole: () => void;
  onOpenAdminConsole: () => void;
}

export const AndroidEmulator: React.FC<AndroidEmulatorProps> = ({
  children,
  isScreenOn,
  onTogglePower,
  isUnlocked,
  onUnlock,
  isAppOpen,
  onLaunchApp,
  onHomePress,
  onBackPress,
  isAdminRole,
  onToggleAdminRole,
  onOpenAdminConsole,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  const [volumeLevel, setVolumeLevel] = useState<number>(75);
  const [showVolumeToast, setShowVolumeToast] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleVolumeUp = () => {
    setVolumeLevel((prev) => Math.min(100, prev + 10));
    setShowVolumeToast(true);
    setTimeout(() => setShowVolumeToast(false), 1800);
  };

  const handleVolumeDown = () => {
    setVolumeLevel((prev) => Math.max(0, prev - 10));
    setShowVolumeToast(true);
    setTimeout(() => setShowVolumeToast(false), 1800);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row items-center justify-center p-2 sm:p-4 md:p-6 gap-6 font-sans antialiased select-none">
      {/* EMULATOR HARDWARE WRAPPER (Pixel 8 Pro Style Chassis) */}
      <div className="relative flex items-center justify-center">
        {/* Physical Left Volume Buttons on device chassis */}
        <div className="absolute -left-3.5 top-36 flex flex-col gap-3 z-30">
          <button
            onClick={handleVolumeUp}
            className="w-1.5 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-l-md active:bg-neutral-500 transition-colors cursor-pointer shadow-md"
            title="Physical Volume Up"
          />
          <button
            onClick={handleVolumeDown}
            className="w-1.5 h-12 bg-neutral-700 hover:bg-neutral-600 rounded-l-md active:bg-neutral-500 transition-colors cursor-pointer shadow-md"
            title="Physical Volume Down"
          />
        </div>

        {/* Physical Right Power Button on device chassis */}
        <div className="absolute -right-3.5 top-28 z-30">
          <button
            onClick={onTogglePower}
            className="w-1.5 h-14 bg-neutral-700 hover:bg-neutral-600 rounded-r-md active:bg-neutral-500 transition-colors cursor-pointer shadow-md"
            title="Physical Power Button"
          />
        </div>

        {/* Phone Outer Chassis (Curved Bezels, Antenna bands, Realistic Glass) */}
        <div className="w-[390px] sm:w-[410px] h-[840px] max-h-[96vh] rounded-[52px] bg-neutral-900 border-[10px] border-neutral-800 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden relative ring-1 ring-black">
          {/* Top Speaker Ear-piece */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-neutral-800 rounded-full z-40"></div>

          {/* Screen Content or Powered Off State */}
          {!isScreenOn ? (
            /* Screen is OFF / Black */
            <div
              onClick={onTogglePower}
              className="flex-1 bg-black flex flex-col items-center justify-center cursor-pointer p-6 text-center"
            >
              <Smartphone size={32} className="text-neutral-700 mb-2" />
              <span className="text-xs text-neutral-600 font-mono">Screen Off</span>
              <span className="text-[11px] text-neutral-500 mt-1">Tap screen or press Power button to turn on</span>
            </div>
          ) : !isUnlocked ? (
            /* Android Lock Screen */
            <div
              onClick={onUnlock}
              className="flex-1 bg-gradient-to-b from-stone-900 via-neutral-900 to-stone-950 flex flex-col justify-between p-6 cursor-pointer relative"
            >
              {/* Android Status Bar on Lock Screen */}
              <div className="w-full flex items-center justify-between text-xs text-neutral-300 pt-2 px-1">
                <span className="font-semibold text-[13px]">{currentTime}</span>
                <div className="w-4 h-4 bg-black rounded-full ring-2 ring-neutral-800 flex items-center justify-center mx-auto">
                  <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2">
                  <Wifi size={14} />
                  <BatteryMedium size={15} className="text-emerald-400" />
                </div>
              </div>

              {/* Big Android Lockscreen Clock */}
              <div className="text-center my-auto space-y-2">
                <h1 className="text-6xl font-light text-white font-mono tracking-tighter">
                  {currentTime}
                </h1>
                <p className="text-xs text-neutral-400 font-medium">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <div className="pt-8">
                  <div className="w-14 h-14 rounded-full bg-neutral-800/80 border border-neutral-700/60 mx-auto flex items-center justify-center text-xl shadow-lg">
                    🔒
                  </div>
                </div>
              </div>

              {/* Swipe/Tap up prompt */}
              <div className="text-center pb-6 space-y-2">
                <div className="w-12 h-1 bg-neutral-500/60 rounded-full mx-auto animate-pulse"></div>
                <span className="text-xs text-neutral-400 font-medium block">
                  Tap anywhere to unlock
                </span>
              </div>
            </div>
          ) : (
            /* Device is ON & UNLOCKED */
            <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900 relative">
              {/* Status Bar */}
              <div className="w-full bg-neutral-900/95 backdrop-blur-md px-6 pt-2.5 pb-1.5 flex items-center justify-between text-xs text-neutral-300 z-30 select-none shrink-0 border-b border-neutral-800/40">
                <span className="font-semibold text-neutral-200 text-[13px]">{currentTime}</span>

                {/* Camera Punch Hole */}
                <div className="w-4 h-4 bg-black rounded-full ring-2 ring-neutral-800 flex items-center justify-center mx-auto shadow-inner">
                  <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full"></div>
                </div>

                <div className="flex items-center gap-2 text-neutral-300">
                  <span className="text-[10px] font-bold text-emerald-400 font-mono">5G</span>
                  <Wifi size={14} />
                  <div className="flex items-center gap-0.5">
                    <span className="text-[11px] font-medium">94%</span>
                    <BatteryMedium size={15} className="text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Volume Indicator HUD Toast */}
              {showVolumeToast && (
                <div className="absolute top-12 left-4 z-50 bg-neutral-800/95 text-white px-3 py-1.5 rounded-full border border-neutral-700 text-xs flex items-center gap-2 shadow-2xl backdrop-blur animate-in fade-in">
                  {volumeLevel > 0 ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} />}
                  <span className="font-mono text-[11px]">{volumeLevel}%</span>
                </div>
              )}

              {/* Screen Body: either Android OS Launcher OR inside the PlateUP App */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-neutral-800">
                {children}
              </div>

              {/* Android System 3-Button Navigation Bar (Back, Home, Recents) */}
              <div className="w-full bg-neutral-950 px-10 py-2.5 flex items-center justify-around border-t border-neutral-800 select-none shrink-0 z-30">
                <button
                  onClick={onBackPress}
                  className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer active:scale-90"
                  title="Android Back"
                >
                  <ChevronLeft size={20} />
                </button>

                <button
                  onClick={onHomePress}
                  className="w-4.5 h-4.5 rounded-full border-2 border-neutral-400 hover:border-white transition-colors cursor-pointer active:scale-90"
                  title="Android Home"
                />

                <button
                  onClick={onHomePress}
                  className="w-4 h-4 rounded-xs border-2 border-neutral-400 hover:border-white transition-colors cursor-pointer active:scale-90"
                  title="Android Overview"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ANDROID STUDIO STYLE EMULATOR SIDEBAR CONTROLS */}
      <div className="flex flex-col gap-3 bg-neutral-900 border border-neutral-800 rounded-3xl p-4 w-full md:w-64 text-xs shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-1.5">
            <Smartphone size={16} className="text-emerald-400" />
            <span className="font-bold text-white text-xs">Device Controls</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            API 34
          </span>
        </div>

        {/* Emulator Side Button Toolbar */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <button
            onClick={onTogglePower}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 flex flex-col items-center gap-1 cursor-pointer"
            title="Power"
          >
            <Power size={16} className={isScreenOn ? 'text-emerald-400' : 'text-neutral-500'} />
            <span className="text-[9px]">Power</span>
          </button>

          <button
            onClick={handleVolumeUp}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 flex flex-col items-center gap-1 cursor-pointer"
            title="Volume +"
          >
            <Volume2 size={16} />
            <span className="text-[9px]">Vol +</span>
          </button>

          <button
            onClick={handleVolumeDown}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 flex flex-col items-center gap-1 cursor-pointer"
            title="Volume -"
          >
            <VolumeX size={16} />
            <span className="text-[9px]">Vol -</span>
          </button>

          <button
            onClick={onHomePress}
            className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60 flex flex-col items-center gap-1 cursor-pointer"
            title="Home"
          >
            <Circle size={16} className="text-emerald-400" />
            <span className="text-[9px]">Home</span>
          </button>
        </div>

        {/* Role Access Switch (Student User vs Coder / Admin) */}
        <div className="pt-2 border-t border-neutral-800 space-y-1.5">
          <span className="text-[11px] font-bold text-neutral-300 block">User Role Permission:</span>
          <button
            onClick={onToggleAdminRole}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              isAdminRole
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Shield size={14} className={isAdminRole ? 'text-amber-400' : 'text-neutral-400'} />
              <span>{isAdminRole ? 'Coder / Admin Mode' : 'Student (User Mode)'}</span>
            </div>
            <span className="text-[10px] font-mono underline">Switch</span>
          </button>

          {isAdminRole ? (
            <p className="text-[10px] text-amber-400/90 leading-tight">
              Admin access enabled. Reference MySQL / PHP / Kotlin design docs are visible.
            </p>
          ) : (
            <p className="text-[10px] text-neutral-500 leading-tight">
              Standard user role. Admin panel and database are completely restricted and invisible.
            </p>
          )}

          {isAdminRole && (
            <button
              onClick={onOpenAdminConsole}
              className="w-full mt-1.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Database size={13} />
              <span>Open Reference Console</span>
            </button>
          )}
        </div>

        {/* Technical Stack Card for Thesis */}
        <div className="pt-2 border-t border-neutral-800 space-y-1 text-[11px] text-neutral-400">
          <div className="flex justify-between">
            <span>Client:</span>
            <span className="font-mono text-emerald-400 font-semibold">React + Vite</span>
          </div>
          <div className="flex justify-between">
            <span>Backend:</span>
            <span className="font-mono text-emerald-400 font-semibold">Node + Express</span>
          </div>
          <div className="flex justify-between">
            <span>AI Engine:</span>
            <span className="font-mono text-emerald-400 font-semibold">Gemini API</span>
          </div>
          <div className="flex justify-between">
            <span>Storage:</span>
            <span className="font-mono text-emerald-400 font-semibold">Browser (local)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
