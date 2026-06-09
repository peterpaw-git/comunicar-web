export interface Contact {
  id: number;
  id_prog: number | null;
  attivo: string | null;
  da_fare: number;
  fatto: number;
  responsabile: string | null;
  filhos: string | null;
  gruppo: string | null;
  cpf: string | null;
  gruppo2: string | null;
  email_1: string | null;
  email_2: string | null;
  whats_mae: string | null;
  whats_pai: string | null;
  pref_int1: string | null;
  pref_int2: string | null;
  boleto: string | null;
  voti: string | null;
  progressivo: number | null;
}

export interface SelectionGroup {
  id: number;
  name: string;
  description: string;
  filter_json: string;
  created_at: string;
}

export interface Template {
  id: number;
  name: string;
  title: string | null;
  body: string | null;
  type: string;
  created_at: string;
}

export interface SendResult {
  contactId?: number;
  responsabile: string;
  channel: string;
  number: string;
  status: 'ok' | 'error';
  error?: string;
}

export interface HistoryEntry {
  id: number;
  type: 'whatsapp' | 'email';
  title: string | null;
  body: string | null;
  recipients_count: number;
  ok_count: number;
  error_count: number;
  sent_at: string;
}

export interface ChatMessage {
  id: string;
  direction: 'out' | 'in';
  text: string;
  timestamp: string;
  status: 'sent' | 'error';
  read: boolean;
  contactId?: number | null;
  bulk?: boolean;
}

export interface ChatContact {
  jid: string;
  contactId: number | null;
  contactName: string | null;
  filhos: string | null;
  label: string | null;       // 'Pai' | 'Mãe' | null
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

export type UserRole = 'admin' | 'coordenadora' | 'secretaria';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface MessageDraft {
  title: string;
  body: string;
  type: 'whatsapp' | 'email';
  imageBase64?: string;
  imageFileName?: string;
  imageMime?: string;
}
