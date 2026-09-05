export type Meta = {
  total: number;
  perPage: number;
  page: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  data: T[];
  meta: Meta;
};

export type EventsDropdownItem = {
  id: string | number;
  date: string;
  event_status_id?: number;
  venues?: {
    venue?: string;
  };
  users_events_user_idTousers?: {
    name?: string;
  };
};

export type ConfirmEventSignature = {
  id?: string | number;
  signature_path?: string | null;
  signature_url?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
};

export type ConfirmEventContract = {
  id?: string | number;
  status?: string | null;
  signed_pdf_path?: string | null;
  signed_pdf_url?: string | null;
  signed_at?: string | null;
  signatures?: ConfirmEventSignature[];
};

export type ConfirmEventCompany = {
  id?: string | number;
  name?: string | null;
  admin_signature?: string | null;
  admin_signature_url?: string | null;
  contact_name?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  sort_code?: string | null;
};

export type ConfirmEventData = {
  id?: string | number;
  user_id?: string | number | null;
  event_status_id?: number;
  users_events_user_idTousers?: {
    id?: string | number;
    name?: string;
    email?: string;
    contact_number?: string;
  };
  users_events_dj_idTousers?: {
    id?: string | number;
    name?: string;
  } | null;
  venues: { id?: string | number; venue: string };
  venue_id?: string | number | null;
  dj_name?: string;
  dj_package_name?: string;
  videography?: string;
  caterer?: string;
  decor?: string;
  venue?: string;
  couple_name?: string;
  entrance_song_style?: string;
  cake_cut_song_style?: string;
  first_dance_song_style?: string;
  cake_song_who_feeds?: string;
  stag_songs?: string;
  access_time: string;
  brief_itinerary?: string;
  hen_songs?: string;
  name?: string;
  entrance_song?: string;
  cake_cut_song?: string;
  first_dance?: string;
  do?: string;
  stag_tune_and_destination?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  access_date?: string;
  event_date_contact?: string;
  everyday_contact_name?: string;
  everyday_contact_number?: string;
  no_of_guests?: string | number;
  deposit_amount?: string | number;
  created_by?: string;
  playlist_request?: string;
  dont?: string;
  hen_tune_and_destination?: string;
  file_uploads?: unknown[];
  event_payments?: ConfirmEventPayment[];
  event_notes?: ConfirmEventNote[];
  contracts?: ConfirmEventContract[];
  contract_token?: string | null;
  contract_signed_at?: string | null;
  contract_pdf_url?: string | null;
  company?: ConfirmEventCompany | null;
  company_names?: ConfirmEventCompany | null;
  total_cost_for_equipment?: string | number | null;
  event_packages?: ConfirmEventPackage[];
};

export type ConfirmEventPayment = {
  id: string | number;
  event_id: string | number | null;
  payment_method_id: string | number;
  date: string;
  amount: string | number;
  reference: string;
  created_at?: string;
  updated_at?: string;
  // some API responses use alternate field names
  payment_amount?: string | number | null;
  payment_date?: string | null;
  payment_reference?: string | null;
};

export type ConfirmEventPackage = {
  id: string | number;
  event_id?: string | number | null;
  equipment?: { id?: string | number; name?: string } | null;
  package_name?: string;
  name?: string;
  sell_price?: string | number | null;
  total_price?: string | number | null;
  quantity?: number | null;
  notes?: string | null;
  rig_notes?: string | null;
  package_type_id?: string | number | null;
};

export type ConfirmEventNote = {
  id: string | number;
  event_id: string | number;
  notes: string;
  note: string;
  created_at: string;
  created_by?: string | null;
  updated_at?: string;
};
