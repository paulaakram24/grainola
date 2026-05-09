'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MOCK_MEETINGS, MOCK_MEETING_DETAIL } from '@/lib/mockData';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  meetingDate: string;
  durationSeconds?: number;
  folder: { id: string; name: string; color: string };
  recordings: { id: string; s3Url: string; mimeType: string; fileName?: string; fileSize?: number; durationSec?: number; createdAt?: string }[];
  summary?: { shortText?: string; status: string } | null;
  _count: { highlights: number };
}

export interface MeetingDetail extends Meeting {
  transcript?: {
    id: string;
    fullText?: string;
    status: string;
    segments: { id: string; text: string; startTime: number; endTime: number }[];
    speakers: { id: string; label: string; name?: string }[];
  } | null;
  summary?: {
    shortText?: string;
    bulletPoints?: string[];
    actionItems?: { text: string; owner?: string; dueDate?: string }[];
    keyTopics?: string[];
    sentiment?: string;
    status: string;
  } | null;
  highlights: { id: string; text: string; startTime: number; endTime: number; color: string; note?: string }[];
}

export function useMeetings(params?: { folderId?: string; search?: string; status?: string }) {
  return useQuery<Meeting[]>({
    queryKey: ['meetings', params],
    queryFn: IS_DEMO
      ? () => {
          let data = MOCK_MEETINGS as Meeting[];
          if (params?.folderId) data = data.filter((m) => m.folder.id === params.folderId);
          if (params?.status)   data = data.filter((m) => m.status === params.status);
          if (params?.search)   data = data.filter((m) => m.title.toLowerCase().includes(params.search!.toLowerCase()));
          return Promise.resolve(data);
        }
      : () => api.get('/meetings', { params }).then((r) => r.data.data),
  });
}

export function useMeeting(id: string) {
  return useQuery<MeetingDetail>({
    queryKey: ['meetings', id],
    queryFn: IS_DEMO
      ? () => {
          if (id === MOCK_MEETING_DETAIL.id) return Promise.resolve(MOCK_MEETING_DETAIL as any);
          const found = MOCK_MEETINGS.find((m) => m.id === id);
          return Promise.resolve({ ...found, transcript: null, highlights: [] } as any);
        }
      : () => api.get(`/meetings/${id}`).then((r) => r.data.data),
    enabled: !!id,
    refetchInterval: IS_DEMO
      ? false
      : (query) => {
          const status = query.state.data?.status;
          return status === 'PROCESSING' || status === 'PENDING' ? 5000 : false;
        },
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? (data: { title: string; description?: string; folderId?: string; meetingDate?: string }) =>
          Promise.resolve({
            id: `m${Date.now()}`,
            status: 'PENDING',
            durationSeconds: null,
            recordings: [],
            summary: null,
            highlights: [],
            _count: { highlights: 0 },
            folder: { id: 'f1', name: 'All Meetings', color: '#6366f1' },
            ...data,
            meetingDate: data.meetingDate ?? new Date().toISOString(),
          } as any)
      : (data: { title: string; description?: string; folderId?: string; meetingDate?: string }) =>
          api.post('/meetings', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useMoveMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? ({ meetingId, folderId }: { meetingId: string; folderId: string }) => Promise.resolve({ meetingId, folderId })
      : ({ meetingId, folderId }: { meetingId: string; folderId: string }) =>
          api.patch(`/meetings/${meetingId}/move`, { folderId }).then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['meetings', vars.meetingId] });
      qc.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? ({ id, ...data }: { id: string; title?: string; description?: string; meetingDate?: string }) =>
          Promise.resolve({ id, ...data })
      : ({ id, ...data }: { id: string; title?: string; description?: string; meetingDate?: string }) =>
          api.put(`/meetings/${id}`, data).then((r) => r.data.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['meetings', vars.id] });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!IS_DEMO) await api.delete(`/meetings/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}

export function useDeleteRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? ({ recordingId }: { meetingId: string; recordingId: string }) => Promise.resolve(recordingId)
      : ({ recordingId }: { meetingId: string; recordingId: string }) =>
          api.delete(`/recordings/${recordingId}`).then((r) => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['meetings', vars.meetingId] });
    },
  });
}

export function useUploadRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? async ({ onProgress }: { meetingId: string; file: File; onProgress?: (pct: number) => void }) => {
          // Simulate upload progress in demo mode
          for (let i = 0; i <= 100; i += 20) {
            await new Promise((r) => setTimeout(r, 200));
            onProgress?.(i);
          }
          return 'demo-recording-id';
        }
      : async ({ meetingId, file, onProgress }: { meetingId: string; file: File; onProgress?: (pct: number) => void }) => {
          onProgress?.(10);
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          const audioBase64 = btoa(binary);
          onProgress?.(50);

          const { data } = await api.post('/recordings/upload', {
            meetingId,
            audioBase64,
            mimeType:  file.type,
            fileName:  file.name,
            fileSize:  file.size,
          }, {
            onUploadProgress: (e) => {
              if (e.total && onProgress) {
                onProgress(50 + Math.round((e.loaded / e.total) * 50));
              }
            },
          });
          onProgress?.(100);
          return data.data.recordingId;
        },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      if (vars && (vars as any).meetingId) {
        qc.invalidateQueries({ queryKey: ['meetings', (vars as any).meetingId] });
      }
    },
  });
}
