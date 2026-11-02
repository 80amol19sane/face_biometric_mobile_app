import type { TemplateStatus } from './faceBiometric';
import { callMethod } from './http';

export type ReviewStatus = Exclude<TemplateStatus, null> | 'Not enrolled';

export interface ReviewRow {
  employee: string;
  employeeName: string;
  status: ReviewStatus;
  consentGivenOn: string | null;
  approvedBy: string | null;
}

interface EmployeeRow {
  name: string;
  employee_name: string;
}

interface TemplateRow {
  employee: string;
  status: Exclude<TemplateStatus, null>;
  consent_given_on: string | null;
  approved_by: string | null;
}

const getList = <T>(doctype: string, fields: string[], filters: object, limit: number) =>
  callMethod<T[]>(
    'frappe.client.get_list',
    { doctype, fields: JSON.stringify(fields), filters: JSON.stringify(filters), limit_page_length: limit },
    'GET',
  );

/** True when this login may read Face Templates (HR Manager or System Manager). */
export async function canReviewFaces(): Promise<boolean> {
  try {
    await getList('Face Template', ['name'], {}, 1);
    return true;
  } catch {
    return false;
  }
}

const ORDER: Record<ReviewStatus, number> = { Pending: 0, 'Not enrolled': 1, Revoked: 2, Active: 3 };

/** Every active employee with the state of their face template; pending ones first. */
export async function listFaceReview(): Promise<ReviewRow[]> {
  const [employees, templates] = await Promise.all([
    getList<EmployeeRow>('Employee', ['name', 'employee_name'], { status: 'Active' }, 0),
    getList<TemplateRow>('Face Template', ['employee', 'status', 'consent_given_on', 'approved_by'], {}, 0),
  ]);
  const byEmployee = new Map(templates.map((t) => [t.employee, t]));
  return employees
    .map((e): ReviewRow => {
      const template = byEmployee.get(e.name);
      return {
        employee: e.name,
        employeeName: e.employee_name,
        status: template?.status ?? 'Not enrolled',
        consentGivenOn: template?.consent_given_on ?? null,
        approvedBy: template?.approved_by ?? null,
      };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.employeeName.localeCompare(b.employeeName));
}

/** Face Template is named after its employee, so the employee id is the document name. */
const runTemplateMethod = (employee: string, method: 'approve' | 'revoke') =>
  callMethod('frappe.handler.run_doc_method', { dt: 'Face Template', dn: employee, method });

export const approveFace = (employee: string) => runTemplateMethod(employee, 'approve');
export const revokeFace = (employee: string) => runTemplateMethod(employee, 'revoke');

/** HR enrols an employee's face in person; the template is Active at once with HR as approver. */
export const enrolEmployeeFace = (employee: string, embedding: string, modelVersion: string) =>
  callMethod<{ employee: string; status: Exclude<TemplateStatus, null> }>('face_biometric.api.enrolment.enrol_employee_face', {
    employee,
    embedding,
    model_version: modelVersion,
    consent: true,
  });
