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
  venues?: {
    venue?: string;
  };
  users_events_user_idTousers?: {
    name?: string;
  };
};

export type ConfirmEventData = {
  users_events_user_idTousers?: {
    name?: string;
    email?: string;
    contact_number?: string;
  };
  venues: { venue: string };
  dj_name?: string;
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
