import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Video, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from "date-fns";

const TIMES = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM"];
const TRAINERS = [
  { id: 1, name: "Sarah Kim", specialty: "Spine & Posture", avatar: "SK" },
  { id: 2, name: "Marcus Lee", specialty: "Athletic Performance", avatar: "ML" },
  { id: 3, name: "Priya Nair", specialty: "Injury Prevention", avatar: "PN" },
];

const STEPS = ["Select Trainer", "Pick Date & Time", "Confirm"];

export default function Booking() {
  const [step, setStep] = useState(0);
  const [trainer, setTrainer] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const today = startOfDay(new Date());
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const handleConfirm = () => setConfirmed(true);

  if (confirmed) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-xl"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#1A1A2E] mb-2">Booking Confirmed!</h2>
          <p className="text-gray-400 text-sm mb-4">
            Your session with <strong className="text-[#1A1A2E]">{trainer?.name}</strong> is scheduled for<br />
            <strong className="text-[#FF6B4A]">{selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}</strong> at <strong className="text-[#FF6B4A]">{selectedTime}</strong>.
          </p>
          <p className="text-xs text-gray-400 mb-6">A calendar invite and video call link will be sent to your email.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#1A1A2E] text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-[#2a2a40] transition-all"
          >
            Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-[#1A1A2E] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-bold text-[#1A1A2E]">Book a Consultation</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i <= step ? "bg-[#FF6B4A] text-white" : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${i === step ? "text-[#1A1A2E]" : "text-gray-400"}`}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px ${i < step ? "bg-[#FF6B4A]" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0: Select trainer */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Choose your trainer</h2>
              <div className="space-y-3">
                {TRAINERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTrainer(t)}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                      trainer?.id === t.id
                        ? "border-[#FF6B4A] bg-orange-50"
                        : "border-gray-100 bg-white hover:border-gray-200"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#1A1A2E] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-[#1A1A2E] text-sm">{t.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.specialty}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                      <Video className="w-3.5 h-3.5" />
                      Video call
                    </div>
                  </button>
                ))}
              </div>
              <button
                disabled={!trainer}
                onClick={() => setStep(1)}
                className="mt-6 w-full bg-[#FF6B4A] disabled:opacity-40 hover:bg-[#e55a3a] text-white font-semibold py-3 rounded-xl text-sm transition-all"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* Step 1: Date & time */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Select a date & time</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-5">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm font-bold text-[#1A1A2E]">{format(currentMonth, "MMMM yyyy")}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {Array(startPad).fill(null).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map((day) => {
                    const isPast = isBefore(day, today);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    return (
                      <button
                        key={day.toISOString()}
                        disabled={isPast}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square rounded-xl text-sm font-medium transition-all flex items-center justify-center ${
                          isSelected
                            ? "bg-[#FF6B4A] text-white"
                            : isPast
                            ? "text-gray-200 cursor-not-allowed"
                            : "text-gray-700 hover:bg-orange-50 hover:text-[#FF6B4A]"
                        }`}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-[#FF6B4A]" />
                    <span className="text-sm font-bold text-[#1A1A2E]">Available times · {format(selectedDate, "MMM d")}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {TIMES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setSelectedTime(t)}
                        className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          selectedTime === t
                            ? "bg-[#FF6B4A] border-[#FF6B4A] text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:border-[#FF6B4A] hover:text-[#FF6B4A]"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-all">
                  Back
                </button>
                <button
                  disabled={!selectedDate || !selectedTime}
                  onClick={() => setStep(2)}
                  className="flex-1 bg-[#FF6B4A] disabled:opacity-40 hover:bg-[#e55a3a] text-white font-semibold py-3 rounded-xl text-sm transition-all"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Confirm */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-xl font-bold text-[#1A1A2E] mb-6">Confirm your booking</h2>
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                {[
                  { label: "Trainer", value: trainer?.name },
                  { label: "Specialty", value: trainer?.specialty },
                  { label: "Date", value: selectedDate ? format(selectedDate, "MMMM d, yyyy") : "" },
                  { label: "Time", value: selectedTime },
                  { label: "Format", value: "60-min Video Call" },
                  { label: "Price", value: "Free (first consultation)" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-400">{row.label}</span>
                    <span className="text-sm font-semibold text-[#1A1A2E]">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition-all">
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 bg-[#FF6B4A] hover:bg-[#e55a3a] text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-lg shadow-orange-200/50"
                >
                  Confirm Booking
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}