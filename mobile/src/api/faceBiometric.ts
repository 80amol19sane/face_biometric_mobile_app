import type { LogType } from '../lib/signing';
import { callMethod } from './http';

const API = 'face_biometric.api';

export type TemplateStatus = 'Pending' | 'Active' | 'Revoked' | null;

export interface MyStatus {
  template: TemplateStatus;
  devices: { name: string; device_label: string | null }[];
}

export const myStatus = () => callMethod<MyStatus>(`${API}.enrolment.my_status`, {}, 'GET');

export const registerDevice = (publicKey: string, label: string) =>
  callMethod<{ device: string }>(`${API}.enrolment.register_device`, { public_key: publicKey, label });

export const enrolFace = (device: string, embedding: string, modelVersion: string) =>
  callMethod<{ status: Exclude<TemplateStatus, null> }>(`${API}.enrolment.enrol_face`, {
    device,
    embedding,
    model_version: modelVersion,
    consent: true,
  });

export const getChallenge = (device: string) =>
  callMethod<{ nonce: string; expires_in: number }>(`${API}.checkin.get_challenge`, { device });

export interface CheckinRequest {
  device: string;
  nonce: string;
  logType: LogType;
  embedding: string;
  signature: string;
  latitude: number | null;
  longitude: number | null;
}

export const submitCheckin = (request: CheckinRequest) =>
  callMethod<{ name: string; time: string; log_type: LogType }>(`${API}.checkin.check_in`, {
    device: request.device,
    nonce: request.nonce,
    log_type: request.logType,
    embedding: request.embedding,
    signature: request.signature,
    latitude: request.latitude,
    longitude: request.longitude,
  });
