export const SERVICE_SAFETY_FLAGS = [
  'gasSmell',
  'smokeOrSparks',
  'electricShock',
  'activeFloodingNearPower',
  'carbonMonoxideAlarm',
  'severeOverheating',
] as const

export type ServiceSafetyFlag = (typeof SERVICE_SAFETY_FLAGS)[number]
export type ServiceSafetyAnswers = Record<ServiceSafetyFlag, boolean>

export type ServiceSafetyResult = {
  stopped: boolean
  triggered: ServiceSafetyFlag[]
  guidance: string
}

export function evaluateServiceSafety(
  answers: Partial<Record<ServiceSafetyFlag, unknown>>,
): ServiceSafetyResult {
  const triggered = SERVICE_SAFETY_FLAGS.filter((flag) => answers[flag] === true)
  return {
    stopped: triggered.length > 0,
    triggered,
    guidance: triggered.length > 0
      ? 'Stop using the equipment. Move away from the immediate hazard, call emergency services for immediate danger, and use the utility or manufacturer emergency number when appropriate.'
      : 'No immediate stop condition was reported. Continue only with steps you are comfortable performing, and stop if conditions change.',
  }
}
