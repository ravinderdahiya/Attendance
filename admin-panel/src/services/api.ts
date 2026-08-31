import type {
  AppNotification, AttendanceRecord, Checkpoint, DashboardStats, FieldVisit, LabourSite, LabourWorkerRow,
  MonthlySummaryRow, Outlet, PatrolCheckpointStatus, PayrollHistory, PayrollRow, Shift, StaffUser, TimesheetRow, TrendPoint,
  Visitor, VisitorStats, WebsiteVisitRow, WebsiteVisitSourceRow, WebsiteVisitStats, WebsiteVisitTrendPoint,
} from '../types';

// Production Docker sets VITE_API_BASE_URL='' meaning same-origin (nginx proxies /api).
// Only use an absolute URL when the env var is a non-empty string — never fall back to
// localhost here, or production builds ship "Failed to fetch" for every API call.
const rawBase = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL =
  typeof rawBase === 'string' && rawBase.trim() !== ''
    ? rawBase.trim().replace(/\/$/, '')
    : '';
const TOKEN_KEY = 'shifttrack_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.errors
      ? (Object.values(data.errors)[0] as string[])[0]
      : data.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

const jsonRequest = <T = any>(path: string, method: string, body?: object) =>
  request<T>(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

export const managerLogin = (username: string, password: string) =>
  jsonRequest<{ success: boolean; token: string; user: StaffUser }>('/api/auth/manager/login', 'POST', { username, password });

export const me = () => request<{ success: boolean; user: StaffUser }>('/api/me');
export const logout = () => jsonRequest('/api/logout', 'POST');

export const getDashboard = () =>
  request<{ success: boolean; stats: DashboardStats; trend: TrendPoint[] }>('/api/admin/dashboard');

export const getStaff = (params?: { search?: string; department?: string }) => {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return request<{ success: boolean; staff: StaffUser[] }>(`/api/admin/staff${query ? `?${query}` : ''}`);
};
export const createStaff = (payload: object) => jsonRequest<{ success: boolean; staff: StaffUser }>('/api/admin/staff', 'POST', payload);
export const updateStaff = (id: number, payload: object) => jsonRequest<{ success: boolean; staff: StaffUser }>(`/api/admin/staff/${id}`, 'PUT', payload);
export const deleteStaff = (id: number) => jsonRequest(`/api/admin/staff/${id}`, 'DELETE');

export const getOutlets = () => request<{ success: boolean; outlets: Outlet[] }>('/api/admin/outlets');
export const createOutlet = (payload: object) => jsonRequest<{ success: boolean; outlet: Outlet }>('/api/admin/outlets', 'POST', payload);
export const updateOutlet = (id: number, payload: object) => jsonRequest<{ success: boolean; outlet: Outlet }>(`/api/admin/outlets/${id}`, 'PUT', payload);

export const getLiveMonitor = (status?: string) =>
  request<{ success: boolean; records: AttendanceRecord[] }>(`/api/admin/live-monitor${status ? `?status=${status}` : ''}`);

export const getShifts = (params: { from: string; to: string; user_id?: number }) => {
  const query = new URLSearchParams(params as any).toString();
  return request<{ success: boolean; shifts: Shift[] }>(`/api/admin/shifts?${query}`);
};
export const createShift = (payload: object) => jsonRequest<{ success: boolean; shift: Shift }>('/api/admin/shifts', 'POST', payload);
export const updateShift = (id: number, payload: object) => jsonRequest<{ success: boolean; shift: Shift }>(`/api/admin/shifts/${id}`, 'PUT', payload);
export const deleteShift = (id: number) => jsonRequest(`/api/admin/shifts/${id}`, 'DELETE');

export const getTimesheets = (params: { from: string; to: string; user_id?: number }) => {
  const query = new URLSearchParams(params as any).toString();
  return request<{ success: boolean; rows: TimesheetRow[] }>(`/api/admin/timesheets?${query}`);
};
export const getMonthlySummary = (month: string) =>
  request<{ success: boolean; month: string; rows: MonthlySummaryRow[] }>(`/api/admin/timesheets/monthly-summary?month=${month}`);

// --- PAYROLL ---
export const getPayroll = (month?: string) =>
  request<{ success: boolean; month: string; rows: PayrollRow[] }>(`/api/admin/payroll${month ? `?month=${month}` : ''}`);
export const createAdvance = (payload: { user_id: number; amount: number; note?: string; given_at?: string }) =>
  jsonRequest<{ success: boolean; advance: unknown }>('/api/admin/advances', 'POST', payload);
export const deleteAdvance = (id: number) => jsonRequest(`/api/admin/advances/${id}`, 'DELETE');
export const getPayrollHistory = (staffId: number) =>
  request<{ success: boolean } & PayrollHistory>(`/api/admin/payroll/${staffId}/history`);

// --- VISITOR LOG ---
export const getVisitors = (date?: string) =>
  request<{ success: boolean; visitors: Visitor[]; stats: VisitorStats }>(`/api/admin/visitors${date ? `?date=${date}` : ''}`);
export const logVisitor = (payload: { outlet_id: number; name: string; purpose: string; host_user_id?: number }) =>
  jsonRequest<{ success: boolean; visitor: Visitor }>('/api/admin/visitors', 'POST', payload);
export const checkOutVisitor = (id: number) =>
  jsonRequest<{ success: boolean; visitor: Visitor }>(`/api/admin/visitors/${id}/check-out`, 'POST');

// --- SECURITY PATROLS ---
export const getCheckpoints = (outletId: number) =>
  request<{ success: boolean; checkpoints: Checkpoint[] }>(`/api/admin/checkpoints?outlet_id=${outletId}`);
export const createCheckpoint = (payload: { outlet_id: number; name: string; sequence: number; expected_time: string }) =>
  jsonRequest<{ success: boolean; checkpoint: Checkpoint }>('/api/admin/checkpoints', 'POST', payload);
export const deleteCheckpoint = (id: number) => jsonRequest(`/api/admin/checkpoints/${id}`, 'DELETE');
export const getPatrols = (outletId: number, date?: string) =>
  request<{ success: boolean; checkpoints: PatrolCheckpointStatus[] }>(`/api/admin/patrols?outlet_id=${outletId}${date ? `&date=${date}` : ''}`);

// --- LABOUR ATTENDANCE ---
export const getLabourSites = () => request<{ success: boolean; sites: LabourSite[] }>('/api/admin/labour/sites');
export const createLabourSite = (payload: { name: string }) =>
  jsonRequest<{ success: boolean; site: LabourSite }>('/api/admin/labour/sites', 'POST', payload);
export const createLabourWorker = (payload: { site_id: number; name: string; trade: string }) =>
  jsonRequest<{ success: boolean; worker: unknown }>('/api/admin/labour/workers', 'POST', payload);
export const getLabourAttendance = (siteId: number, date?: string) =>
  request<{ success: boolean; date: string; workers: LabourWorkerRow[] }>(`/api/admin/labour/attendance?site_id=${siteId}${date ? `&date=${date}` : ''}`);
export const saveLabourAttendance = (payload: { date: string; entries: { worker_id: number; present: boolean }[] }) =>
  jsonRequest('/api/admin/labour/attendance', 'POST', payload);

// --- FIELD VISITS ---
export const getFieldVisits = (userId: number, date?: string) =>
  request<{ success: boolean; visits: FieldVisit[] }>(`/api/admin/field-visits?user_id=${userId}${date ? `&date=${date}` : ''}`);

export const getWebsiteVisits = () =>
  request<{
    success: boolean;
    stats: WebsiteVisitStats;
    trend: WebsiteVisitTrendPoint[];
    sources: WebsiteVisitSourceRow[];
    visits: WebsiteVisitRow[];
  }>('/api/admin/website-visits');

// --- NOTIFICATIONS (admin login also gets a staff-style token, so this works if ever needed) ---
export const getNotifications = () => request<{ success: boolean; notifications: AppNotification[] }>('/api/notifications');
