import TravelerHotbar from "@/components/layout/TravelerHotbar";
import { gameText } from "@/constants/gameText";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-screen px-6 pb-32">
        {/* Hero Section */}
        <div className="text-center max-w-2xl">
          {/* Logo/Title */}
          <h1 className="text-5xl font-bold text-foreground mb-4 font-[family-name:var(--font-nunito)]">
            🗺️ Brain Trails
          </h1>
          <p className="text-xl text-muted mb-8 font-[family-name:var(--font-quicksand)]">
            Your cozy gamified study companion
          </p>

          {/* Status Card - Cozy Style */}
          <div className="glass rounded-2xl p-6 mb-8 shadow-[var(--shadow-cozy)]">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-foreground">
                {gameText.status.online}
              </span>
            </div>
            <p className="text-muted text-sm">
              Welcome, {gameText.user.user}! Ready to {gameText.actions.start.toLowerCase()} on your learning adventure?
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-soft)] border border-border">
              <span className="text-2xl">⚔️</span>
              <p className="text-xs text-muted mt-1">{gameText.tasks.tasks}</p>
              <p className="text-lg font-bold text-foreground">0</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-soft)] border border-border">
              <span className="text-2xl">✨</span>
              <p className="text-xs text-muted mt-1">{gameText.progress.xp}</p>
              <p className="text-lg font-bold text-accent">0</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-[var(--shadow-soft)] border border-border">
              <span className="text-2xl">🔥</span>
              <p className="text-xs text-muted mt-1">Streak</p>
              <p className="text-lg font-bold text-foreground">0</p>
            </div>
          </div>

          {/* CTA Button - Cozy Style */}
          <button className="btn-cozy bg-primary text-foreground hover:bg-primary-hover">
            {gameText.actions.start} Your Journey
          </button>
        </div>
      </main>

      {/* Floating Hotbar */}
      <TravelerHotbar />
    </div>
  );
}
