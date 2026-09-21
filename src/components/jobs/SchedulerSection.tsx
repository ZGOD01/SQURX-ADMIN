import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { JobSchedulerJobs } from '../../types/jobsAdmin';
import { validateCronExpression } from '../../utils/cronValidator';

interface SchedulerSectionProps {
  schedulerEnabled: boolean;
  onSchedulerEnabledChange: (enabled: boolean) => void;
  jobs: JobSchedulerJobs;
  onJobConfigChange: <K extends keyof JobSchedulerJobs>(
    jobKey: K,
    config: JobSchedulerJobs[K]
  ) => void;
}

export default function SchedulerSection({
  schedulerEnabled,
  onSchedulerEnabledChange,
  jobs,
  onJobConfigChange,
}: SchedulerSectionProps) {
  // Sync tasks definition
  const tasks: {
    key: keyof JobSchedulerJobs;
    title: string;
    description: string;
    hasTimeFrame: boolean;
    defaultTimeFrame?: string;
  }[] = [
    {
      key: 'activeSync',
      title: 'Active Jobs Sync',
      description: 'Fetches newly opened and active job postings across platforms',
      hasTimeFrame: true,
      defaultTimeFrame: '1h',
    },
    {
      key: 'modifiedSync',
      title: 'Modified Jobs Sync',
      description: 'Updates recently altered salaries, descriptions, or status updates',
      hasTimeFrame: true,
      defaultTimeFrame: '1h',
    },
    {
      key: 'expiredSync',
      title: 'Expired Jobs Sync',
      description: 'Detects and flags jobs that have been closed or expired',
      hasTimeFrame: true,
      defaultTimeFrame: '1d',
    },
    {
      key: 'organizationsSync',
      title: 'Organizations Sync',
      description: 'Periodically synchronizes company directories and employer metadata',
      hasTimeFrame: false, // Explicitly NO timeFrame
    },
  ];

  const presets = [
    { label: 'Every 15m', expr: '*/15 * * * *' },
    { label: 'Every 30m', expr: '*/30 * * * *' },
    { label: 'Hourly', expr: '0 * * * *' },
    { label: 'Daily 2 AM', expr: '0 2 * * *' },
    { label: 'Weekly Sun', expr: '0 0 * * 0' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── Master Scheduler Banner ───────────────────────────────────────── */}
      <div
        className={`rounded-3xl p-6 md:p-8 border transition-all ${
          schedulerEnabled
            ? 'bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border-emerald-200/80 shadow-sm'
            : 'bg-gradient-to-r from-amber-50/70 to-orange-50/70 border-amber-200/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                schedulerEnabled
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Master Scheduler</h2>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    schedulerEnabled
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {schedulerEnabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                {schedulerEnabled
                  ? 'Automatic synchronization is enabled globally. Enabled job schedules below will run at their specified cron intervals.'
                  : 'Automatic synchronization is currently disabled globally. No cron jobs will execute until this master switch is re-enabled.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              {schedulerEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={schedulerEnabled}
              onClick={() => onSchedulerEnabledChange(!schedulerEnabled)}
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center shadow-inner ${
                schedulerEnabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full mx-1 transition-transform duration-200 shadow-md ${
                  schedulerEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 Sync Task Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.map((task) => {
          const config = jobs[task.key];
          const isEnabled = config?.enabled ?? false;
          const cron = config?.cronExpression || '';
          const timeFrame = 'timeFrame' in config ? (config.timeFrame as string) : '';
          const validation = validateCronExpression(cron);

          return (
            <div
              key={task.key}
              className={`bg-white rounded-3xl p-6 md:p-7 border shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-gray-100 transition-all ${
                !schedulerEnabled || !isEnabled
                  ? 'border-gray-200 opacity-80'
                  : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{task.title}</h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isEnabled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {isEnabled ? 'Task Enabled' : 'Task Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  onClick={() =>
                    onJobConfigChange(task.key, {
                      ...config,
                      enabled: !isEnabled,
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                    isEnabled ? 'bg-black' : 'bg-gray-200'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Cron Expression Field */}
              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Cron Expression (5 Fields)
                  </label>
                  {validation.isValid ? (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {validation.description}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {validation.error}
                    </span>
                  )}
                </div>

                <input
                  type="text"
                  value={cron}
                  onChange={(e) =>
                    onJobConfigChange(task.key, {
                      ...config,
                      cronExpression: e.target.value,
                    })
                  }
                  placeholder="0 * * * *"
                  className={`w-full font-mono bg-gray-50/50 px-4 py-2.5 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent ${
                    validation.isValid
                      ? 'border-gray-200 focus:ring-black'
                      : 'border-red-300 focus:ring-red-500 bg-red-50/20'
                  }`}
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-400 mr-1">Presets:</span>
                  {presets.map((preset) => (
                    <button
                      key={preset.expr}
                      type="button"
                      onClick={() =>
                        onJobConfigChange(task.key, {
                          ...config,
                          cronExpression: preset.expr,
                        })
                      }
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-colors ${
                        cron === preset.expr
                          ? 'bg-black text-white border-black'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TimeFrame Field: ONLY for Active, Modified, Expired (NEVER for organizationsSync) */}
              {task.hasTimeFrame && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
                    Time Frame (e.g. 1h, 24h, 1d)
                  </label>
                  <input
                    type="text"
                    value={timeFrame}
                    onChange={(e) => {
                      if (task.key !== 'organizationsSync') {
                        onJobConfigChange(task.key, {
                          ...config,
                          timeFrame: e.target.value,
                        });
                      }
                    }}
                    placeholder="e.g. 1h"
                    className="w-full bg-gray-50/50 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Defines how far back Fantastic.jobs queries for updates during each run.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
