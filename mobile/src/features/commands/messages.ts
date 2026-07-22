export interface Message {
  id: string;
  message: string;
  response: string;
  work_date: string;
  created_at: string;
}

export interface MessagesResponse {
  data: Message[];
  error: null;
}

const createMessage = (workDate: string, monthName: string, day: number): Message => ({
  id: `message-${workDate}`,
  message: `Am ${day}. ${monthName} 2026 von 08:15 bis 17:00 Uhr gearbeitet, 30 Minuten Pause im Büro.`,
  response: `Arbeitstag für den ${String(day).padStart(2, '0')}.${workDate.slice(5, 7)}.2026 erfolgreich eingetragen.`,
  work_date: workDate,
  created_at: `${workDate}T17:05:00.000Z`,
});

const mayWorkDays = [4, 5, 7, 11, 13, 18, 20, 22, 27, 29];
const juneWorkDays = [1, 3, 5, 8, 10, 15, 18, 22, 25, 29];

/**
 * Simulates the result returned by a Supabase messages query until persisted
 * messages are available in the backend.
 */
export const dummyMessagesResponse: MessagesResponse = {
  data: [
    ...mayWorkDays.map((day) => createMessage(`2026-05-${String(day).padStart(2, '0')}`, 'Mai', day)),
    ...juneWorkDays.map((day) => createMessage(`2026-06-${String(day).padStart(2, '0')}`, 'Juni', day)),
  ],
  error: null,
};
