export interface AdminProgram {
  id: number
  title?: string
  name?: string
  code: 'program_a' | 'program_b'
  description: string
}

export interface AdminCall {
  id: number
  program: 'a' | 'b' | string | number
  name: string
  status: 'draft' | 'open' | 'closed' | 'archived'
  opens_at: string | null
  deadline_at: string | null
  min_team_size: number
  max_team_size: number | null
  form_config?: string
}

export interface RequiredDocument {
  document_name: string
  is_mandatory: boolean
  max_size_mb: number
  type?: string
}

export interface DashboardStats {
  total_users: number
  students?: number
  company_owners?: number
  admins?: number
  content_editors?: number
  evaluators?: number
  mentors?: number
  total_calls: number
  open_calls?: number
  total_applications: number
  application_submitted?: number
  application_active?: number
  application_closed?: number
}

export interface AdminApplication {
  id: number
  status: string
  program_type: string
  applicant_name?: string
  team_name?: string
  call_id?: number
  created_at?: string
}

export interface AdminApplicationListItem {
  id: number
  applicant_type: string
  student_profile: any
  team: any
  program: string
  program_type: string
  call_name: string
  datum: string
  status: string
}

export interface AdminUser {
  id: number
  email: string
  first_name?: string
  last_name?: string
  status?: string
  roles?: { slug: string; name?: string }[]
}

export interface AdminRole {
  slug: string
  name?: string
}

export interface DocumentItem {
  id: number
  file_name: string
  mime_type?: string
  file_size_bytes?: number
  type?: string
  classification?: string
  application_id?: number
  application_name?: string | null
  uploaded_by?: number
  created_at?: string
}

export interface CallPayload {
  program_type: string
  title: string
  status: string
  opens_at: string
  deadline_at: string
  min_team_size: number
  max_team_size: number
  evaluation_criteria: unknown[]
  required_documents: RequiredDocument[]
  form_config?: string
}

export interface CreateAdminPayload {
  email: string
  password: string
  first_name: string
  last_name: string
  role?: string
}

export interface BulkNotificationPayload {
  recipient_group: string
  subject: string
  message: string
}

export interface Call {
  id: number
  name: string
  [key: string]: any
}

export interface Sender {
  id: number
  first_name?: string | null
  last_name?: string | null
  email: string
}

export interface NotificationItem {
  id: number
  subject: string
  message: string
  recipient_group: string
  sender_id: number | null
  sender: Sender | null
  created_at: string
  total_recipients: number
}

export interface StatusMessage {
  ok: boolean
  text: string
}

export interface GroupOption {
  value: string
  label: string
}

export interface EvaluationCriterion {
  id?: number
  call_id: number
  slug: string
  title: string
  comment: string | null
  weight: number
  created_at?: string
  updated_at?: string
}

export interface EvaluationCriterionPayloadItem {
  id?: number
  slug: string
  title: string
  comment?: string | null
  weight: number
}

export interface EvaluationCriterionPayload {
  criteria: EvaluationCriterionPayloadItem[]
}

export interface FinalizeEvaluationPayload {
  status: string
  comment: string | null
}

export type AdminTaskStatus =
  | 'draft'
  | 'published'
  | 'in_matching'
  | 'assigned'
  | 'in_progress'
  | 'closed'

export interface AdminTaskOrganization {
  id: number
  name: string
}

export interface AdminTaskProductOwner {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
}

export interface AdminTaskCall {
  id: number
  deadline_at?: string | null
  opens_at?: string | null
}

export interface AdminTask {
  id: number
  title: string
  brief?: string | null
  short_description?: string | null
  budget?: string | null
  status: AdminTaskStatus
  product_owner_user_id?: number | null
  organization_id?: number
  call_id?: number
  created_at?: string
  updated_at?: string
  organization?: AdminTaskOrganization
  product_owner?: AdminTaskProductOwner
  call?: AdminTaskCall
}