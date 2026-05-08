// ─── Mock data for Demo Mode (no backend required) ───────────────────────────

export const MOCK_USER = {
  id: 'demo-user-1',
  name: 'Dr. Sarah Johnson',
  email: 'sarah.johnson@hospital.org',
  avatarUrl: null,
};

export const MOCK_FOLDERS = [
  { id: 'f1', name: 'All Meetings',   isDefault: true,  color: '#6366f1', position: 0, _count: { meetings: 5 } },
  { id: 'f2', name: 'Patient Reviews', isDefault: false, color: '#10b981', position: 1, _count: { meetings: 2 } },
  { id: 'f3', name: 'Team Meetings',   isDefault: false, color: '#3b82f6', position: 2, _count: { meetings: 2 } },
  { id: 'f4', name: 'Consultations',   isDefault: false, color: '#f59e0b', position: 3, _count: { meetings: 1 } },
];

export const MOCK_MEETINGS = [
  {
    id: 'm1',
    title: 'Q3 Research Review — Cardiology Dept.',
    description: 'Quarterly review of ongoing research projects and clinical trials.',
    status: 'COMPLETED',
    meetingDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 3480,
    folder: { id: 'f2', name: 'Patient Reviews', color: '#10b981' },
    recordings: [{ id: 'r1', s3Url: '', mimeType: 'audio/mp4', durationSec: 3480 }],
    summary: { shortText: 'The team reviewed three ongoing clinical trials and agreed on updated protocols for patient enrollment. Key decision: extend trial B timeline by 6 weeks due to enrollment shortfall.', status: 'COMPLETED' },
    _count: { highlights: 3 },
    participants: [{ name: 'Dr. Sarah Johnson' }, { name: 'Dr. Ahmed Khalil' }, { name: 'Prof. Lena Müller' }],
  },
  {
    id: 'm2',
    title: 'Weekly Department Standup',
    description: 'Weekly sync across all department leads.',
    status: 'COMPLETED',
    meetingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 1620,
    folder: { id: 'f3', name: 'Team Meetings', color: '#3b82f6' },
    recordings: [{ id: 'r2', s3Url: '', mimeType: 'audio/mp4', durationSec: 1620 }],
    summary: { shortText: 'Standup covered staffing updates, upcoming conference presentations, and lab equipment requests. Three action items assigned.', status: 'COMPLETED' },
    _count: { highlights: 1 },
    participants: [{ name: 'Dr. Sarah Johnson' }, { name: 'Dr. Tariq Hassan' }],
  },
  {
    id: 'm3',
    title: 'Patient Case Discussion — Case #4471',
    description: 'Multi-disciplinary team discussion for complex cardiac case.',
    status: 'COMPLETED',
    meetingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 2700,
    folder: { id: 'f4', name: 'Consultations', color: '#f59e0b' },
    recordings: [{ id: 'r3', s3Url: '', mimeType: 'audio/mp4', durationSec: 2700 }],
    summary: { shortText: 'MDT reached consensus on treatment plan for Case #4471. Surgical intervention scheduled for next Thursday, with pre-op workup to begin immediately.', status: 'COMPLETED' },
    _count: { highlights: 5 },
    participants: [{ name: 'Dr. Sarah Johnson' }, { name: 'Dr. Mona Adel' }, { name: 'Dr. Yusuf Nour' }],
  },
  {
    id: 'm4',
    title: 'Grant Application Planning',
    description: 'Planning session for the upcoming NIH grant submission.',
    status: 'PROCESSING',
    meetingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: null,
    folder: { id: 'f3', name: 'Team Meetings', color: '#3b82f6' },
    recordings: [{ id: 'r4', s3Url: '', mimeType: 'audio/mp4', durationSec: null }],
    summary: null,
    _count: { highlights: 0 },
    participants: [],
  },
  {
    id: 'm5',
    title: 'New Resident Orientation',
    description: 'Onboarding session for incoming residents.',
    status: 'PENDING',
    meetingDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: null,
    folder: { id: 'f1', name: 'All Meetings', color: '#6366f1' },
    recordings: [],
    summary: null,
    _count: { highlights: 0 },
    participants: [],
  },
];

export const MOCK_MEETING_DETAIL = {
  ...MOCK_MEETINGS[0],
  transcript: {
    id: 't1',
    fullText: 'Good morning everyone. Thank you for joining the Q3 research review...',
    status: 'COMPLETED',
    language: 'en',
    segments: [
      { id: 's1',  text: "Good morning everyone. Thank you all for joining today's Q3 research review.",                                          startTime: 0,    endTime: 5.2  },
      { id: 's2',  text: "Let's start with Trial A — the hypertension management study. Dr. Khalil, can you give us the current enrollment numbers?", startTime: 5.5,  endTime: 13.1 },
      { id: 's3',  text: "Sure. We currently have 142 enrolled out of a target of 200. We're on track to hit the milestone by end of October.",       startTime: 13.4, endTime: 21.8 },
      { id: 's4',  text: "That's positive. What about the dropout rate compared to last quarter?",                                                    startTime: 22.1, endTime: 26.3 },
      { id: 's5',  text: "Dropout rate is down to 4.2%, which is well within our acceptable range. The revised follow-up protocol is working.",        startTime: 26.6, endTime: 34.2 },
      { id: 's6',  text: "Excellent. Now moving to Trial B — the cardiac rehabilitation program. Prof. Müller, the floor is yours.",                   startTime: 35.0, endTime: 42.5 },
      { id: 's7',  text: "Thank you. Trial B is facing headwinds. Enrollment is at 67 out of 150, significantly behind target.",                       startTime: 43.0, endTime: 51.4 },
      { id: 's8',  text: "What are the contributing factors?",                                                                                        startTime: 52.0, endTime: 53.8 },
      { id: 's9',  text: "Primarily referral bottlenecks from the general cardiology clinic. We also had two site investigators leave in July.",       startTime: 54.1, endTime: 63.2 },
      { id: 's10', text: "I think we need to consider extending the enrollment window. I'd suggest a 6-week extension on the timeline.",              startTime: 64.0, endTime: 71.6 },
      { id: 's11', text: "Agreed. That would push the final analysis to Q1 next year but preserves the statistical power we need.",                   startTime: 72.0, endTime: 80.3 },
      { id: 's12', text: "Let's put that to a vote. All in favour of the 6-week extension for Trial B?",                                             startTime: 81.0, endTime: 86.5 },
      { id: 's13', text: "Approved. Dr. Khalil, please update the IRB submission by Friday.",                                                        startTime: 87.0, endTime: 92.8 },
      { id: 's14', text: "Understood. I'll have the amendment ready by Thursday.",                                                                    startTime: 93.1, endTime: 97.4 },
      { id: 's15', text: "Good. Finally, Trial C — the AI-assisted diagnostics pilot. Can we get a quick status update?",                            startTime: 98.0, endTime: 105.2 },
      { id: 's16', text: "Trial C is progressing well. We've processed 890 scans and the model accuracy is holding at 91.4%.",                       startTime: 105.6, endTime: 114.8 },
      { id: 's17', text: "That's above our target threshold. Very encouraging.",                                                                      startTime: 115.2, endTime: 118.4 },
      { id: 's18', text: "We expect to submit the interim analysis to the journal by end of November.",                                              startTime: 118.8, endTime: 124.6 },
      { id: 's19', text: "Perfect. Let's make sure the manuscript gets a full team review before submission.",                                       startTime: 125.0, endTime: 130.2 },
      { id: 's20', text: "Agreed. I'll circulate the draft two weeks before submission.",                                                            startTime: 130.6, endTime: 135.8 },
      { id: 's21', text: "Thank you all. To summarise: Trial A on track, Trial B gets a 6-week extension pending IRB amendment, Trial C on target. See you next quarter.", startTime: 136.2, endTime: 148.0 },
    ],
    speakers: [
      { id: 'sp1', label: 'Speaker 1', name: 'Dr. Sarah Johnson' },
      { id: 'sp2', label: 'Speaker 2', name: 'Dr. Ahmed Khalil'  },
      { id: 'sp3', label: 'Speaker 3', name: 'Prof. Lena Müller'  },
    ],
  },
  summary: {
    shortText: 'The team reviewed three ongoing clinical trials and agreed on updated protocols for patient enrollment. Key decision: extend trial B timeline by 6 weeks due to enrollment shortfall. Trial A and Trial C are both on track.',
    bulletPoints: [
      'Trial A (Hypertension Management): 142/200 enrolled, dropout rate 4.2% — on track for October milestone.',
      'Trial B (Cardiac Rehabilitation): significantly behind at 67/150; enrollment window extended by 6 weeks.',
      'Trial C (AI Diagnostics Pilot): 890 scans processed, model accuracy at 91.4% — above threshold.',
      'IRB amendment for Trial B to be submitted by Dr. Khalil by Thursday.',
      'Trial C interim analysis manuscript to be circulated for team review before November submission.',
    ],
    actionItems: [
      { text: 'Submit IRB amendment for Trial B 6-week extension',       owner: 'Dr. Khalil',       dueDate: 'Thursday' },
      { text: 'Circulate Trial C manuscript draft for team review',       owner: 'Prof. Müller',     dueDate: '2 weeks before Nov submission' },
      { text: 'Address referral bottlenecks from general cardiology clinic', owner: 'Dr. Sarah Johnson', dueDate: 'End of month' },
    ],
    keyTopics:    ['Clinical Trials', 'Patient Enrollment', 'IRB Amendment', 'AI Diagnostics', 'Cardiac Rehabilitation', 'Research Timeline'],
    sentiment:    'positive',
    status:       'COMPLETED',
  },
  highlights: [
    { id: 'h1', text: 'Dropout rate is down to 4.2%',              startTime: 26.6,  endTime: 34.2,  color: '#fbbf24', note: 'Great improvement from last quarter' },
    { id: 'h2', text: 'Enrollment is at 67 out of 150',            startTime: 43.0,  endTime: 51.4,  color: '#f87171', note: 'Action needed' },
    { id: 'h3', text: 'Model accuracy is holding at 91.4%',        startTime: 105.6, endTime: 114.8, color: '#34d399', note: 'Above target' },
  ],
};

export const MOCK_CALENDAR_EVENTS = [
  {
    id: 'evt1',
    summary: 'MDT Meeting — Complex Cases',
    start: { dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
    attendees: [{ displayName: 'Dr. Sarah Johnson' }, { displayName: 'Dr. Ahmed Khalil' }, { displayName: 'Dr. Mona Adel' }],
  },
  {
    id: 'evt2',
    summary: 'Research Steering Committee',
    start: { dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
    attendees: [{ displayName: 'Dr. Sarah Johnson' }, { displayName: 'Prof. Lena Müller' }],
  },
  {
    id: 'evt3',
    summary: 'Grand Rounds Presentation Prep',
    start: { dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() },
    attendees: [{ displayName: 'Dr. Sarah Johnson' }],
  },
  {
    id: 'evt4',
    summary: 'Journal Club — Cardiology',
    start: { dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    attendees: [{ displayName: 'Dr. Sarah Johnson' }, { displayName: 'Dr. Yusuf Nour' }, { displayName: 'Dr. Tariq Hassan' }],
  },
];

export const MOCK_SEARCH_RESULTS = [
  {
    id: 'sr1',
    title: 'Q3 Research Review — Cardiology Dept.',
    meetingDate: MOCK_MEETINGS[0].meetingDate,
    segment: { text: 'Dropout rate is down to 4.2%, which is well within our acceptable range.', startTime: 26.6, endTime: 34.2 },
  },
  {
    id: 'sr2',
    title: 'Q3 Research Review — Cardiology Dept.',
    meetingDate: MOCK_MEETINGS[0].meetingDate,
    segment: { text: 'Trial C is progressing well. We\'ve processed 890 scans and the model accuracy is holding at 91.4%.', startTime: 105.6, endTime: 114.8 },
  },
];
