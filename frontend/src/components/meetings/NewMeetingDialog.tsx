'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, Square, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFolders } from '@/hooks/useFolders';
import { useCreateMeeting, useUploadRecording } from '@/hooks/useMeetings';
import { toast } from '@/hooks/useToast';

type RecordState = 'idle' | 'recording' | 'recorded';

function localDateTimeNow() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
}

const schema = z.object({
  title:       z.string().min(1, 'Title required'),
  folderId:    z.string().optional(),
  meetingDate: z.string().min(1, 'Date required'),
});
type FormData = z.infer<typeof schema>;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function NewMeetingDialog({ onClose }: { onClose: () => void }) {
  const { data: folders = [] } = useFolders();
  const createMeeting = useCreateMeeting();
  const uploadRecording = useUploadRecording();

  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [done, setDone] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      folderId:    folders.find((f) => f.isDefault)?.id,
      meetingDate: localDateTimeNow(),
    },
  });

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = '#f3f4f6';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#6366f1';
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordState('recorded');
        stream.getTracks().forEach((t) => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      recorder.start(100);
      setRecordState('recording');
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      drawWaveform();
    } catch {
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone access in your browser and try again.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsed(0);
    setRecordState('idle');
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const onSubmit = async (data: FormData) => {
    try {
      const meeting = await createMeeting.mutateAsync({
        title: data.title,
        folderId: data.folderId || undefined,
        meetingDate: new Date(data.meetingDate).toISOString(),
      });

      if (audioBlob) {
        const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
        const file = new File([audioBlob], `recording-${Date.now()}.${ext}`, { type: audioBlob.type });
        await uploadRecording.mutateAsync({
          meetingId: meeting.id,
          file,
          onProgress: setUploadProgress,
        });
      }

      setDone(true);
      setTimeout(onClose, 1500);
    } catch {
      toast({ title: 'Failed to save meeting', description: 'Please try again.', variant: 'destructive' });
    }
  };

  const isPending = createMeeting.isPending || uploadRecording.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-gray-900">New Meeting</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium">Recording saved!</p>
            <p className="text-sm text-muted-foreground">Transcription is in progress…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div className="space-y-2">
              <Label>Meeting title</Label>
              <Input placeholder="Weekly standup" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Meeting date</Label>
              <Input type="datetime-local" {...register('meetingDate')} />
              {errors.meetingDate && <p className="text-xs text-destructive">{errors.meetingDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Folder</Label>
              <select
                {...register('folderId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Recorder */}
            <div className="border border-border rounded-lg p-4 bg-gray-50">
              {recordState === 'idle' && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={startRecording}
                    aria-label="Start recording"
                    className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  >
                    <Mic className="h-7 w-7 text-white" />
                  </button>
                  <p className="text-sm text-muted-foreground">Click to start recording</p>
                </div>
              )}

              {recordState === 'recording' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="font-mono text-xl font-semibold tabular-nums tracking-widest">
                      {formatTime(elapsed)}
                    </span>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={360}
                    height={56}
                    className="w-full rounded"
                  />
                  <button
                    type="button"
                    onClick={stopRecording}
                    aria-label="Stop recording"
                    className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-md transition-transform active:scale-95"
                  >
                    <Square className="h-5 w-5 text-white fill-white" />
                  </button>
                  <p className="text-xs text-muted-foreground">Click to stop</p>
                </div>
              )}

              {recordState === 'recorded' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Recording — {formatTime(elapsed)}
                    </span>
                    <button
                      type="button"
                      onClick={discardRecording}
                      className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Discard
                    </button>
                  </div>
                  {audioUrl && (
                    <audio src={audioUrl} controls className="w-full h-9" />
                  )}
                </div>
              )}
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="space-y-1">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">{uploadProgress}%</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={isPending || recordState === 'recording'}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                {recordState === 'recorded' ? 'Save & Process' : 'Create Meeting'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
