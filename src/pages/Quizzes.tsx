import { useState } from 'react';
import { Clock, Calendar as CalendarIcon, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

// Define the days of the week
const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

interface TimeSlot {
  id: string;
  startTime: string; // e.g., "09:00 AM"
  endTime: string;   // e.g., "10:00 AM"
}

interface DayAvailability {
  day: string;
  isAvailable: boolean;
  slots: TimeSlot[];
}

export default function Quizzes() {
  // Initialize state with default availability for all days, but with empty slots unless specified.
  // The default "show all" can be interpreted as either:
  // 1. All days available from 9am to 6pm, OR
  // 2. Just have no slots selected but the frontend handles if none are selected.
  // We'll give it a clean initial state.
  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      isAvailable: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day),
      slots: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(day) 
        ? [{ id: crypto.randomUUID(), startTime: '10:00', endTime: '18:00' }] 
        : []
    }))
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleDayAvailability = (dayIndex: number) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].isAvailable = !newAvailability[dayIndex].isAvailable;
    // If making available and no slots exist, add a default one
    if (newAvailability[dayIndex].isAvailable && newAvailability[dayIndex].slots.length === 0) {
      newAvailability[dayIndex].slots = [{ id: crypto.randomUUID(), startTime: '09:00', endTime: '17:00' }];
    }
    setAvailability(newAvailability);
    setSaved(false);
  };

  const addTimeSlot = (dayIndex: number) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots.push({ id: crypto.randomUUID(), startTime: '09:00', endTime: '17:00' });
    setAvailability(newAvailability);
    setSaved(false);
  };

  const removeTimeSlot = (dayIndex: number, slotId: string) => {
    const newAvailability = [...availability];
    newAvailability[dayIndex].slots = newAvailability[dayIndex].slots.filter(s => s.id !== slotId);
    if (newAvailability[dayIndex].slots.length === 0) {
       // Optionally set isAvailable to false if no slots
       newAvailability[dayIndex].isAvailable = false;
    }
    setAvailability(newAvailability);
    setSaved(false);
  };

  const updateTimeSlot = (dayIndex: number, slotId: string, field: 'startTime' | 'endTime', value: string) => {
    const newAvailability = [...availability];
    const slotIndex = newAvailability[dayIndex].slots.findIndex(s => s.id === slotId);
    if (slotIndex > -1) {
      newAvailability[dayIndex].slots[slotIndex][field] = value;
      setAvailability(newAvailability);
      setSaved(false);
    }
  };

  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-500" />
            Call Availability & Quizzes
          </h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Set your weekly availability for making calls and hosting quizzes. 
            Selected slots will be visible on the frontend. If no specific slots are set, default hours will be used.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-white shadow-lg transition-all duration-300 ${
            saved 
              ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25' 
              : 'bg-black hover:bg-gray-800 hover:shadow-black/20 hover:-translate-y-0.5'
          } ${saving ? 'opacity-80 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Schedule</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
        </div>

        <div className="space-y-6">
          {availability.map((dayData, dayIndex) => (
            <div 
              key={dayData.day} 
              className={`flex flex-col lg:flex-row gap-4 p-5 rounded-2xl transition-colors duration-200 ${
                dayData.isAvailable ? 'bg-gray-50/80 border border-gray-100' : 'bg-transparent border border-transparent'
              }`}
            >
              <div className="flex items-center justify-between w-full lg:w-48 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDayAvailability(dayIndex)}
                    className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                      dayData.isAvailable ? 'bg-black' : 'bg-gray-200'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-300 shadow-sm ${
                        dayData.isAvailable ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`font-medium ${dayData.isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>
                    {dayData.day}
                  </span>
                </div>
              </div>

              <div className="flex-1">
                {dayData.isAvailable ? (
                  <div className="flex flex-col gap-3">
                    {dayData.slots.map((slot) => (
                      <div key={slot.id} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateTimeSlot(dayIndex, slot.id, 'startTime', e.target.value)}
                            className="bg-white px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700 w-[110px]"
                          />
                          <span className="text-gray-400 text-sm font-medium">-</span>
                          <input
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateTimeSlot(dayIndex, slot.id, 'endTime', e.target.value)}
                            className="bg-white px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-gray-700 w-[110px]"
                          />
                        </div>
                        <button
                          onClick={() => removeTimeSlot(dayIndex, slot.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addTimeSlot(dayIndex)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 w-fit px-3 py-1.5 rounded-lg transition-colors mt-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add another slot
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center h-full">
                    <span className="text-gray-400 text-sm font-medium italic">Unavailable</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
