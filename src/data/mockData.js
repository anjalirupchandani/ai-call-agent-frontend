// Mock data layer.
// Every page reads from here for now. Once services/api.js is wired to
// FastAPI, these shapes are what the real API responses should match.

export const currentUser = {
  name: "Ava Whitfield",
  email: "ava@northlanecare.com",
  role: "Operations Lead",
  avatarInitials: "AW",
};

export const aiAgents = [
  { id: "agt_1", name: "Riley", personality: "Warm & Consultative", voice: "Female · US English" },
  { id: "agt_2", name: "Sawyer", personality: "Direct & Efficient", voice: "Male · US English" },
  { id: "agt_3", name: "Nadia", personality: "Friendly Support", voice: "Female · UK English" },
];

export const contacts = [
  { id: "c1", name: "Marcus Bell", phone: "+1 (415) 552-0148", email: "marcus.bell@example.com", tag: "Lead", lastCall: "2 days ago" },
  { id: "c2", name: "Priya Nandakumar", phone: "+1 (312) 664-9021", email: "priya.n@example.com", tag: "Customer", lastCall: "5 days ago" },
  { id: "c3", name: "Diego Ferreira", phone: "+1 (646) 220-7734", email: "diego.f@example.com", tag: "Lead", lastCall: "1 week ago" },
  { id: "c4", name: "Helen Osei", phone: "+1 (206) 771-3390", email: "helen.osei@example.com", tag: "VIP", lastCall: "3 days ago" },
  { id: "c5", name: "Tom Whitcombe", phone: "+1 (720) 445-1182", email: "tom.w@example.com", tag: "Customer", lastCall: "Yesterday" },
  { id: "c6", name: "Sana Iqbal", phone: "+1 (512) 883-0067", email: "sana.iqbal@example.com", tag: "Lead", lastCall: "2 weeks ago" },
];

export const calls = [
  { id: "call_1001", contact: "Marcus Bell", phone: "+1 (415) 552-0148", date: "Aug 20, 2026", time: "3:42 PM", duration: "4:12", status: "Completed", type: "Outbound", agent: "Riley" },
  { id: "call_1002", contact: "Priya Nandakumar", phone: "+1 (312) 664-9021", date: "Aug 20, 2026", time: "1:05 PM", duration: "1:58", status: "Completed", type: "Outbound", agent: "Sawyer" },
  { id: "call_1003", contact: "Diego Ferreira", phone: "+1 (646) 220-7734", date: "Aug 19, 2026", time: "5:20 PM", duration: "0:00", status: "Missed", type: "Inbound", agent: "Riley" },
  { id: "call_1004", contact: "Helen Osei", phone: "+1 (206) 771-3390", date: "Aug 19, 2026", time: "11:30 AM", duration: "6:47", status: "Completed", type: "Outbound", agent: "Nadia" },
  { id: "call_1005", contact: "Tom Whitcombe", phone: "+1 (720) 445-1182", date: "Aug 18, 2026", time: "9:12 AM", duration: "0:41", status: "Failed", type: "Outbound", agent: "Sawyer" },
  { id: "call_1006", contact: "Sana Iqbal", phone: "+1 (512) 883-0067", date: "Aug 17, 2026", time: "4:03 PM", duration: "3:15", status: "Completed", type: "Outbound", agent: "Riley" },
  { id: "call_1007", contact: "Marcus Bell", phone: "+1 (415) 552-0148", date: "Aug 16, 2026", time: "2:00 PM", duration: "2:29", status: "In Progress", type: "Outbound", agent: "Riley" },
];

export const dashboardStats = {
  totalCalls: 1284,
  totalCallsDelta: "+12.4%",
  completedCalls: 1103,
  completedCallsDelta: "+8.1%",
  totalDuration: "142h 08m",
  totalDurationDelta: "+3.6%",
  successRate: "85.9%",
  successRateDelta: "+2.2%",
};

export const callsOverview = [
  { day: "Mon", calls: 62, completed: 51 },
  { day: "Tue", calls: 78, completed: 68 },
  { day: "Wed", calls: 55, completed: 47 },
  { day: "Thu", calls: 91, completed: 80 },
  { day: "Fri", calls: 84, completed: 74 },
  { day: "Sat", calls: 40, completed: 33 },
  { day: "Sun", calls: 28, completed: 24 },
];

export const transcriptSample = [
  { speaker: "ai", text: "Hello! This is Riley calling from Northlane Care. Do you have a quick minute to talk?" },
  { speaker: "customer", text: "Oh, hi. Yeah, I have a minute, what's this about?" },
  { speaker: "ai", text: "I wanted to follow up on the inquiry you submitted about our home care services. I can walk you through pricing and availability." },
  { speaker: "customer", text: "Sure, that would be helpful. What areas do you cover?" },
  { speaker: "ai", text: "We currently cover the greater Bay Area, including Oakland and San Jose. Would you like me to check availability for your zip code?" },
  { speaker: "customer", text: "Yes please, it's 94610." },
  { speaker: "ai", text: "Great news — we have two caregivers available in your area starting next week. I can schedule a free consultation call, does Thursday at 2 PM work?" },
];

export const callDetailsSample = {
  id: "call_1001",
  contact: { name: "Marcus Bell", phone: "+1 (415) 552-0148", email: "marcus.bell@example.com" },
  date: "August 20, 2026",
  time: "3:42 PM",
  duration: "4:12",
  status: "Completed",
  agent: "Riley",
  summary:
    "Marcus was inquiring about home care pricing for his mother. He confirmed his zip code, expressed interest in a Thursday consultation, and asked about weekend availability. Overall sentiment was positive and engaged.",
  insights: [
    "Customer showed high intent — asked about pricing twice",
    "Prefers afternoon call windows",
    "Mentioned a decision timeline of \"within two weeks\"",
  ],
  followUp: "Schedule the Thursday 2 PM consultation and send a pricing summary by email beforehand.",
  transcript: transcriptSample,
};
