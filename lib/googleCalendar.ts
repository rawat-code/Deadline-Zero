export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

/**
 * Fetch upcoming calendar events from the primary calendar
 */
export async function fetchUpcomingEvents(accessToken: string, maxResults = 10): Promise<CalendarEvent[]> {
  try {
    const timeMin = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error fetching Google Calendar events:", error);
    throw error;
  }
}

/**
 * Create a new event on the primary Google Calendar
 */
export async function createCalendarEvent(
  accessToken: string,
  params: {
    summary: string;
    description: string;
    startDateStr: string; // YYYY-MM-DD
    startTimeStr: string; // HH:MM (24h)
    endTimeStr: string;   // HH:MM (24h)
  }
): Promise<CalendarEvent> {
  try {
    const { summary, description, startDateStr, startTimeStr, endTimeStr } = params;

    // Combine date and time
    // E.g. "2026-06-29" + "T" + "10:00" + ":00"
    const startDateTime = new Date(`${startDateStr}T${startTimeStr}:00`).toISOString();
    const endDateTime = new Date(`${startDateStr}T${endTimeStr}:00`).toISOString();

    const body = {
      summary,
      description,
      start: {
        dateTime: startDateTime,
      },
      end: {
        dateTime: endDateTime,
      },
    };

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw error;
  }
}
