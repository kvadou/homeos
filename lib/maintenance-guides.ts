export type MaintenanceGuideStep = {
  title: string
  detail: string
  confirmation?: string
}

export type MaintenanceGuideResource = {
  label: string
  detail: string
  url: string
  kind: 'official' | 'video'
}

export type MaintenanceGuide = {
  key: string
  title: string
  summary: string
  whyItMatters: string
  time: string
  difficulty: string
  cadence: string
  tools: string[]
  safety: string[]
  stopWhen: string[]
  steps: MaintenanceGuideStep[]
  resources: MaintenanceGuideResource[]
  professionalSummary: string
}

type GuideInput = {
  title: string
  detail: string | null
  recurrence: string | null
  template_slug: string | null
}

type ItemInput = {
  name: string
  manufacturer: string | null
  model: string | null
} | null

const refrigeratorCoils: MaintenanceGuide = {
  key: 'refrigerator-coils',
  title: 'Vacuum refrigerator coils',
  summary: 'Remove reachable dust from the condenser intake or exposed coils without opening the sealed mechanical compartment.',
  whyItMatters: 'Dust and pet hair can restrict airflow around an owner-accessible condenser. Cleaning the reachable area can support cooling efficiency and reduce unnecessary compressor work.',
  time: '15–25 minutes',
  difficulty: 'Easy, if owner-accessible',
  cadence: 'Usually once or twice a year',
  tools: [
    'Vacuum with a soft brush or crevice attachment',
    'Refrigerator coil brush',
    'Flashlight',
    'Work gloves',
    'Towel or floor protector',
  ],
  safety: [
    'Check the owner’s manual first. Some refrigerators have condensers that do not require owner cleaning.',
    'Unplug the refrigerator before removing a toe grille or vacuuming near the condenser area.',
    'Protect the water line, power cord, and floor if the refrigerator must move.',
  ],
  stopWhen: [
    'The condenser is behind a screwed or sealed mechanical-compartment cover.',
    'You see damaged wiring, leaking fluid, heavy corrosion, smoke, sparks, or overheated parts.',
    'The refrigerator is built in, top-condenser, or too heavy to move safely without help.',
  ],
  steps: [
    {
      title: 'Confirm your model’s layout',
      detail: 'Find the model number in GatheredOS or on the refrigerator label, then check the owner’s manual. Look for “condenser,” “coil cleaning,” or “care and cleaning.” Do not assume every model has accessible coils.',
      confirmation: 'The manual says the owner can clean this area.',
    },
    {
      title: 'Prepare the refrigerator',
      detail: 'Keep the doors closed, move loose items off the top, protect the floor, and make sure you can reach the plug. If the appliance must move, have another adult help and watch the water line.',
      confirmation: 'The floor, cord, and water line are protected.',
    },
    {
      title: 'Disconnect power',
      detail: 'Unplug the refrigerator. A short unplugged period with the doors closed should not materially affect the food temperature. Never clean around the condenser while power is connected.',
      confirmation: 'The refrigerator is unplugged.',
    },
    {
      title: 'Open only the owner-accessible area',
      detail: 'For bottom-mounted coils, remove the snap-off toe grille or follow the manual’s grille instructions. For exposed rear coils, carefully move the refrigerator away from the wall. Do not remove a sealed rear mechanical cover.',
      confirmation: 'Only the manual-approved grille or exposed area is open.',
    },
    {
      title: 'Loosen and vacuum the dust',
      detail: 'Use a soft coil brush to loosen dust and pet hair, then vacuum it away with light passes. Avoid bending fins, pulling wires, striking fan blades, or pressing on refrigerant tubing.',
      confirmation: 'Reachable dust is removed without disturbing components.',
    },
    {
      title: 'Clean the surrounding floor',
      detail: 'Vacuum the floor, wall edge, and ventilation openings. Keeping the surrounding intake area clear helps airflow after the refrigerator is returned to place.',
      confirmation: 'The intake area and floor are clear.',
    },
    {
      title: 'Reassemble and restore power',
      detail: 'Replace the grille, return the refrigerator without rolling over the cord or tubing, and reconnect power. Confirm that the doors close fully and listen for normal operation.',
      confirmation: 'The grille is secure and the refrigerator is running normally.',
    },
  ],
  resources: [
    {
      label: 'GE Appliances: cleaning condenser coils',
      detail: 'Official guidance covering bottom, rear, and top condenser layouts—including models that do not require cleaning.',
      url: 'https://products.geappliances.com/appliance/gea-support-search-content?contentId=16266',
      kind: 'official',
    },
    {
      label: 'LG: cleaning the rear of a refrigerator',
      detail: 'Official safety guidance explaining when to clean only the exterior cover and leave disassembly to a technician.',
      url: 'https://www.lg.com/us/support/help-library/lg-refrigerator-how-do-i-clean-the-rear-of-my-lg-refrigerator-CT10000021-20153122276486',
      kind: 'official',
    },
    {
      label: 'Whirlpool: cleaning the condenser',
      detail: 'Official step-by-step condenser cleaning guidance for applicable Whirlpool models.',
      url: 'https://producthelp.whirlpool.com/%40api/deki/pages/17262/pdf/Cleaning%2Bthe%2BCondenser.pdf',
      kind: 'official',
    },
  ],
  professionalSummary: 'An appliance technician can identify the condenser layout, move the refrigerator safely, clean inaccessible areas, and check cooling performance without risking sealed-system components.',
}

const dishwasherFilter: MaintenanceGuide = {
  key: 'dishwasher-filter',
  title: 'Clean the dishwasher filter',
  summary: 'Remove and rinse the owner-accessible filter so food debris does not restrict drainage or recirculation.',
  whyItMatters: 'A dirty filter can leave residue on dishes, contribute to odors, and reduce cleaning performance.',
  time: '10–15 minutes',
  difficulty: 'Easy',
  cadence: 'Every 1–3 months',
  tools: ['Soft brush or old toothbrush', 'Warm water', 'Towel', 'Owner’s manual'],
  safety: [
    'Turn the dishwasher off and let hot components cool before reaching into the tub.',
    'Check the owner’s manual for the correct filter release direction and reassembly order.',
    'Wear gloves if broken glass or sharp debris could be present.',
  ],
  stopWhen: [
    'The filter will not release with light hand pressure.',
    'You find broken glass, damaged screens, standing water near electrical components, or a persistent drain error.',
  ],
  steps: [
    { title: 'Confirm the filter location', detail: 'Check the manual, then remove the lower rack. Most owner-cleanable filters sit beneath the lower spray arm.', confirmation: 'The filter assembly matches the manual.' },
    { title: 'Turn the dishwasher off', detail: 'Make sure the cycle is stopped and the interior has cooled. Use the breaker if the manual requires power disconnection for filter service.', confirmation: 'The dishwasher is off and cool.' },
    { title: 'Remove the filter', detail: 'Follow the marked arrows or manual instructions to unlock and lift the upper filter. Remove the lower screen only if the manual shows it as removable.', confirmation: 'The filter is out without force.' },
    { title: 'Rinse and brush gently', detail: 'Rinse under warm running water. Use a soft brush for stuck-on debris; avoid wire brushes and abrasive pads that can damage the mesh.', confirmation: 'The mesh is clear and undamaged.' },
    { title: 'Inspect the sump area', detail: 'Wipe away visible debris without pushing objects into the pump opening. Do not remove covers or screws that the manual does not identify as user-serviceable.', confirmation: 'The accessible area is clear.' },
    { title: 'Reinstall and test', detail: 'Seat and lock the filter exactly as shown in the manual, replace the rack, and run a short rinse cycle. Stop if you hear grinding or see a leak.', confirmation: 'The filter is locked and the rinse sounds normal.' },
  ],
  resources: [],
  professionalSummary: 'An appliance technician can clear deeper obstructions, diagnose drain errors, and replace a damaged filter or pump component.',
}

function genericGuide(task: GuideInput): MaintenanceGuide {
  return {
    key: task.template_slug || 'home-maintenance',
    title: task.title,
    summary: task.detail?.trim() || 'Review the recorded maintenance task and complete only the steps that are safe and owner-serviceable.',
    whyItMatters: task.detail?.trim() || 'Keeping this task current preserves the home’s maintenance history and helps prevent avoidable wear.',
    time: 'Varies by home',
    difficulty: 'Check before starting',
    cadence: task.recurrence || 'As needed',
    tools: ['Owner’s manual or installation guide', 'Phone camera for before-and-after records', 'Appropriate protective equipment'],
    safety: [
      'Review the manufacturer or installer instructions before opening, disconnecting, or moving equipment.',
      'Disconnect energy sources only when the documented procedure tells you how to do so safely.',
    ],
    stopWhen: [
      'The work involves gas, refrigerant, live electrical parts, structural access, a fall risk, or a sealed component.',
      'The observed condition differs from the documented procedure or you are not comfortable continuing.',
    ],
    steps: [
      { title: 'Confirm the exact equipment or area', detail: 'Open the linked home record and verify the model, material, and condition before relying on general instructions.' },
      { title: 'Review the authoritative instructions', detail: 'Use the owner’s manual, installation guide, or a qualified professional’s procedure for this exact task.' },
      { title: 'Prepare the work area', detail: 'Gather the correct tools, protect nearby surfaces, and keep children and pets away from the work zone.' },
      { title: 'Complete only owner-serviceable work', detail: 'Stop before sealed, energized, gas, refrigerant, structural, or inaccessible components.' },
      { title: 'Test and document the result', detail: 'Restore the area, confirm normal operation, take a photo if useful, and record the maintenance as complete.' },
    ],
    resources: [],
    professionalSummary: 'A qualified local professional can confirm the scope, complete the work safely, and provide a service record for your home history.',
  }
}

export function maintenanceGuideFor(task: GuideInput): MaintenanceGuide {
  const slug = task.template_slug?.toLowerCase() ?? ''
  const title = task.title.toLowerCase()
  if (slug === 'fridge-coils-annual' || /refrigerator.*coil|coil.*refrigerator/.test(title)) return refrigeratorCoils
  if (slug === 'dishwasher-filter-quarterly' || /dishwasher.*filter|filter.*dishwasher/.test(title)) return dishwasherFilter
  return genericGuide(task)
}

export function maintenanceVideoSearchUrl(guide: MaintenanceGuide, item: ItemInput): string {
  const model = [item?.manufacturer, item?.model].filter(Boolean).join(' ')
  const query = [model, guide.title, 'official instructions'].filter(Boolean).join(' ')
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
