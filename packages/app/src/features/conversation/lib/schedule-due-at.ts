import type { ScheduleCommitPayload, SchedulePreset } from "../types";

function isoAtLocalDateTime(localValue: string): string {
  return new Date(localValue).toISOString();
}

export function dueAtFromScheduleCommit(
  payload: ScheduleCommitPayload,
  presets: readonly SchedulePreset[],
): string {
  if (payload.customIso) return isoAtLocalDateTime(payload.customIso);
  if (payload.presetId) {
    const preset = presets.find((entry) => entry.id === payload.presetId);
    if (preset?.dueAtIso) return preset.dueAtIso;
  }
  return isoAtLocalDateTime(payload.dueAtIso);
}

export function buildDefaultSchedulePresets(now = new Date()): readonly SchedulePreset[] {
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);

  const tomorrowAfternoon = new Date(now);
  tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
  tomorrowAfternoon.setHours(14, 0, 0, 0);

  const morningLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(tomorrowMorning);

  const afternoonLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(tomorrowAfternoon);

  return [
    {
      id: "morning",
      label: "Tomorrow morning",
      whenLabel: `Tomorrow, ${morningLabel}`,
      dueAtIso: tomorrowMorning.toISOString(),
    },
    {
      id: "afternoon",
      label: "Tomorrow afternoon",
      whenLabel: `Tomorrow, ${afternoonLabel}`,
      dueAtIso: tomorrowAfternoon.toISOString(),
    },
  ];
}
