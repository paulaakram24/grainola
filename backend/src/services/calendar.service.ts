import { google, calendar_v3 } from 'googleapis';
import { User } from '../models/User';
import { Meeting } from '../models/Meeting';
import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { meetingService } from './meeting.service';

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

export class CalendarService {
  getAuthUrl(userId: string) {
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: userId,
      prompt: 'consent',
    });
  }

  async handleCallback(code: string, userId: string) {
    const { tokens } = await oauth2Client.getToken(code);
    await User.findByIdAndUpdate(userId, {
      googleAccessToken:  tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry:  tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    });
    return { connected: true };
  }

  async disconnectCalendar(userId: string) {
    await User.findByIdAndUpdate(userId, {
      $unset: { googleAccessToken: 1, googleRefreshToken: 1, googleTokenExpiry: 1 },
    });
  }

  async getUpcomingEvents(userId: string, maxResults = 20) {
    const client = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin:    new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items ?? [];
  }

  async importEventsAsMeetings(userId: string, eventIds: string[]) {
    const client = await this.getAuthorizedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: client });
    const created: any[]   = [];
    const skipped: any[]   = [];
    const failures: any[]  = [];

    for (const eventId of eventIds) {
      try {
        const existing = await Meeting.findOne({ userId, calendarEventId: eventId });
        if (existing) {
          skipped.push({ eventId, reason: 'already imported' });
          continue;
        }

        const { data: event } = await calendar.events.get({ calendarId: 'primary', eventId });

        // Build a meeting date that is always valid. event.start.dateTime is full ISO,
        // event.start.date is YYYY-MM-DD for all-day events. Fall back to "now".
        const rawDate = event.start?.dateTime ?? event.start?.date ?? null;
        let meetingDate: Date = new Date();
        if (rawDate) {
          const parsed = new Date(rawDate);
          if (!Number.isNaN(parsed.getTime())) meetingDate = parsed;
        }

        const meeting = await meetingService.createMeeting(userId, {
          title:       event.summary ?? 'Untitled Meeting',
          description: event.description ?? undefined,
          meetingDate: meetingDate.toISOString(),
        });

        await Meeting.findByIdAndUpdate(meeting._id, {
          calendarEventId: eventId,
          calendarSource:  'google',
          participants:    (event.attendees ?? []).map((a) => ({ name: a.displayName, email: a.email })),
        });

        created.push(meeting);
      } catch (err: any) {
        failures.push({ eventId, error: err?.message ?? 'Unknown error' });
      }
    }

    if (created.length === 0 && failures.length > 0) {
      // Surface the first failure reason so the UI can show something useful.
      throw new AppError(
        `Could not import any events. ${failures[0].error}`,
        500,
      );
    }
    return created;
  }

  private async getAuthorizedClient(userId: string) {
    const user = await User.findById(userId);
    if (!user?.googleAccessToken) {
      throw new AppError('Google Calendar not connected. Please authorise first.', 401);
    }

    oauth2Client.setCredentials({
      access_token:  user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date:   user.googleTokenExpiry?.getTime(),
    });

    if (user.googleTokenExpiry && user.googleTokenExpiry < new Date()) {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await User.findByIdAndUpdate(userId, {
        googleAccessToken: credentials.access_token,
        googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      });
      oauth2Client.setCredentials(credentials);
    }

    return oauth2Client;
  }
}

export const calendarService = new CalendarService();
