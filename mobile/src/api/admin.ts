import type { ShiftStanding } from '../lib/shift';
import type { LogType } from '../lib/signing';
import { callMethod } from './http';

const API = 'face_biometric.api.admin';
const get = <T>(fn: string, args: Record<string, unknown> = {}) => callMethod<T>(`${API}.${fn}`, args, 'GET');
const post = <T>(fn: string, args: Record<string, unknown> = {}) => callMethod<T>(`${API}.${fn}`, args, 'POST');

export interface Dashboard {
  total: number;
  face_registered: number;
  pin_registered: number;
  not_enrolled: number;
  present_today: number;
  failed_today: number;
  pending: number;
  offline_today: number;
  awaiting_review: number;
}

export type ShowFilter = 'all' | 'no_face' | 'no_pin' | 'inactive';
export type FaceStatus = 'Active' | 'Pending' | 'Revoked' | null;

export interface EmployeeSummary {
  employee: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
  mobile: string;
  status: string;
  face: FaceStatus;
  /** null: no PIN set. true / false: set and enabled / disabled. */
  pin: boolean | null;
}

export interface EmployeeList {
  employees: EmployeeSummary[];
  counts: Record<ShowFilter, number>;
}

export interface EmployeeProfile {
  employee: string;
  employee_name: string;
  department: string | null;
  designation: string | null;
  mobile: string;
  status: string;
  shift: string | null;
  face: { status: Exclude<FaceStatus, null>; approved_by: string | null; approved_on: string | null; model_version: string | null; dimensions: number | null; creation: string; modified: string } | null;
  pin: { enabled: 0 | 1; set_by: string | null; set_on: string | null } | null;
}

export interface HistoryEvent {
  when: string;
  by: string;
  summary: string;
}

export interface AttendanceLog {
  name: string;
  employee: string;
  employee_name: string;
  log_type: LogType;
  time: string;
  method: 'Face' | 'PIN';
  device: string | null;
  standing: (ShiftStanding & { name: string }) | null;
}

export interface AttendanceDay {
  date: string;
  summary: { in: number; out: number; late: number; by_pin: number };
  logs: AttendanceLog[];
}

export interface FailedAttempt {
  name: string;
  creation: string;
  employee: string | null;
  employee_name: string | null;
  outcome: string;
  method: 'Face' | 'PIN';
  similarity: number | null;
  detail: string | null;
  device: string | null;
  photo: string | null;
}

export interface DeviceRow {
  name: string;
  device_kind: 'Personal' | 'Kiosk' | null;
  device_label: string | null;
  location: string | null;
  allow_offline: 0 | 1;
  status: 'Active' | 'Revoked';
  employee_name: string | null;
  last_seen: string | null;
}

export interface SyncStatus {
  server_time: string;
  site: string;
  last_punch: { time: string; employee: string } | null;
  templates: number;
  settings_updated: string;
}

/** An offline scan the server could not settle by itself, waiting for HR. */
export interface HeldScan {
  name: string;
  creation: string;
  employee: string;
  employee_name: string | null;
  device: string | null;
  recorded_at: string;
  similarity: number | null;
  detail: string | null;
}

export interface AdminSettings {
  require_liveness: number;
  pin_enabled: number;
  pin_min_length: number;
  pin_max_length: number;
  kiosk_return_seconds: number;
  photo_retention_days: number;
  offline_enabled: number;
  offline_max_hours: number;
  held_retention_days: number;
  /** Absent until the server has been restarted on the version that sends it. */
  offline_review_floor?: number;
  offline_clock_tolerance_minutes: number;
  match_threshold: number;
  identify_margin: number;
  max_failed_attempts: number;
  lockout_minutes: number;
  can_edit_recognition: boolean;
}

export const dashboard = () => get<Dashboard>('dashboard');
export const employees = (search: string, show: ShowFilter, start = 0) => get<EmployeeList>('employees', { search: search || undefined, show, start, limit: 30 });
export const employeeProfile = (employee: string) => get<EmployeeProfile>('employee_profile', { employee });
export const biometricHistory = (employee: string) => get<HistoryEvent[]>('biometric_history', { employee });
export const attendanceLogs = (date?: string) => get<AttendanceDay>('attendance_logs', { date });
export const failedAttempts = (date?: string, method?: 'Face' | 'PIN') => get<FailedAttempt[]>('failed_attempts', { date, method });
export const devices = () => get<DeviceRow[]>('devices');
export const offlineReview = () => get<HeldScan[]>('offline_review');
export const approveOffline = (log: string, note: string) => post('approve_offline', { log, note });
export const rejectOffline = (log: string, note: string) => post('reject_offline', { log, note });
export const setDeviceOffline = (device: string, allow: boolean) => post('set_device_offline', { device, allow: allow ? 1 : 0 });
export const syncStatus = () => get<SyncStatus>('sync_status');
export const adminSettings = () => get<AdminSettings>('get_settings');

export const setPin = (employee: string, pin: string, password: string) => post('set_pin', { employee, pin, password });
export const setPinEnabled = (employee: string, enabled: boolean, password: string) => post('set_pin_enabled', { employee, enabled: enabled ? 1 : 0, password });
export const revokeDevice = (device: string) => post('revoke_device', { device });
export const updateSettings = (values: Partial<Omit<AdminSettings, 'can_edit_recognition'>>) => post<AdminSettings>('update_settings', { values: JSON.stringify(values) });

/** HR enrols or replaces an employee's face in person. Active at once, with HR recorded as approver. */
export const enrolFace = (employee: string, embedding: string, modelVersion: string) =>
  callMethod<{ employee: string; status: string }>('face_biometric.api.enrolment.enrol_employee_face', { employee, embedding, model_version: modelVersion, consent: true });

/** Shift Locations HR can give a kiosk, read with the admin's own permissions. */
export async function shiftLocations(): Promise<string[]> {
  const rows = await callMethod<{ name: string }[]>('frappe.client.get_list', { doctype: 'Shift Location', fields: JSON.stringify(['name']), limit_page_length: 50 }, 'GET');
  return rows.map((r) => r.name);
}
