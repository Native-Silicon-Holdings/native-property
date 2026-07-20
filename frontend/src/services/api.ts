import { supabase } from '../lib/supabase';

// =============================================================================
// Re-export supabase client for convenience
// =============================================================================
export { supabase } from '../lib/supabase';

// =============================================================================
// Types
// =============================================================================
/** @deprecated Prefer AuthContext User (orgRole / estateRole). Kept for loose page typing. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'DIRECTOR' | 'HOMEOWNER' | 'TENANT' | 'ACCOUNTANT';
  isActive: boolean;
  emailVerified: boolean;
  unit?: Unit;
  createdAt: string;
  lastLogin?: string;
}

export interface Estate {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  coverUrl?: string;
  address?: string;
  active: boolean;
}

export interface Unit {
  id: string;
  organizationId: string;
  estateId: string;
  unitNumber: string;
  address: string;
  unitType: 'HOUSE' | 'APARTMENT' | 'TOWNHOUSE' | 'COMMERCIAL';
  squareMeters: number;
  occupants: number;
}

// =============================================================================
// Estate API — the operational child of an organization (org → estates → units)
// =============================================================================
export const estateApi = {
  list: async (organizationId: string) => {
    return supabase
      .schema('native_estate')
      .from('estates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('active', true)
      .order('name', { ascending: true });
  },

  getBySlug: async (organizationId: string, slug: string) => {
    return supabase
      .schema('native_estate')
      .from('estates')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('slug', slug)
      .single();
  },

  create: async (data: { organization_id: string; name: string; slug: string; address?: string; cover_url?: string }) => {
    return supabase
      .schema('native_estate')
      .from('estates')
      .insert(data)
      .select()
      .single();
  },
};

// =============================================================================
// Document API — direct Supabase queries
// =============================================================================
export const documentApi = {
  getAll: async (params?: { estateId?: string; category?: string; search?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('documents')
      .select('*', { count: 'exact' })
      .order('uploaded_at', { ascending: false });

    if (params?.estateId) query = query.eq('estate_id', params.estateId);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.search) query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('documents')
      .select('*, document_versions(*)')
      .eq('id', id)
      .single();
  },

  upload: async (data: { estate_id: string; title: string; description?: string; category: string; file_url: string; file_size: number; tags?: string[]; uploaded_by_id: string }) => {
    return supabase
      .schema('native_estate')
      .from('documents')
      .insert(data)
      .select()
      .single();
  },

  update: async (id: string, data: { title?: string; description?: string; category?: string; approval_status?: string }) => {
    return supabase
      .schema('native_estate')
      .from('documents')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  uploadVersion: async (documentId: string, data: { file_url: string; change_notes?: string; uploaded_by_id: string; version: number }) => {
    return supabase
      .schema('native_estate')
      .from('document_versions')
      .insert({ ...data, document_id: documentId })
      .select()
      .single();
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('documents')
      .delete()
      .eq('id', id);
  },
};

// =============================================================================
// Announcement API — direct Supabase queries
// =============================================================================
export const announcementApi = {
  getAll: async (params?: { estateId?: string; category?: string; priority?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('announcements')
      .select('*, announcement_reads(user_id, acknowledged)', { count: 'exact' })
      .order('posted_at', { ascending: false });

    if (params?.estateId) query = query.eq('estate_id', params.estateId);
    if (params?.category) query = query.eq('category', params.category);
    if (params?.priority) query = query.eq('priority', params.priority);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('announcements')
      .select('*, announcement_reads(user_id, acknowledged, read_at)')
      .eq('id', id)
      .single();
  },

  create: async (data: { estate_id: string; title: string; content: string; category: string; priority?: string; is_pinned?: boolean; requires_acknowledgment?: boolean; posted_by_id: string }) => {
    return supabase
      .schema('native_estate')
      .from('announcements')
      .insert(data)
      .select()
      .single();
  },

  update: async (id: string, data: { title?: string; content?: string; category?: string; priority?: string; is_pinned?: boolean }) => {
    return supabase
      .schema('native_estate')
      .from('announcements')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  acknowledge: async (announcementId: string, userId: string) => {
    return supabase
      .schema('native_estate')
      .from('announcement_reads')
      .upsert({ announcement_id: announcementId, user_id: userId, acknowledged: true })
      .select()
      .single();
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('announcements')
      .delete()
      .eq('id', id);
  },
};

// =============================================================================
// Utility API — direct Supabase queries for reads, RPC for writes
// =============================================================================
export const utilityApi = {
  getReadings: async (params?: { estateId?: string; unit_id?: string; utility_type?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('utility_readings')
      .select(params?.estateId ? '*, units!inner(estate_id, organization_id)' : '*, units(organization_id)', { count: 'exact' })
      .order('reading_date', { ascending: false });

    if (params?.estateId) query = query.eq('units.estate_id', params.estateId);
    if (params?.unit_id) query = query.eq('unit_id', params.unit_id);
    if (params?.utility_type) query = query.eq('utility_type', params.utility_type);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getConsumption: async (unitId: string, params?: { utility_type?: string }) => {
    let query = supabase
      .schema('native_estate')
      .from('utility_readings')
      .select('*')
      .eq('unit_id', unitId)
      .order('reading_date', { ascending: false });

    if (params?.utility_type) query = query.eq('utility_type', params.utility_type);

    return query;
  },

  addReading: async (data: {
    unit_id: string;
    utility_type: string;
    reading_date: string;
    meter_reading: number;
    previous_reading: number;
    rate: number;
  }) => {
    // NOTE: the underlying RPC's parameter is still named p_property_id (schema
    // renamed properties -> units, but this RPC's signature has not been migrated).
    return supabase.rpc('rpc_add_utility_reading', {
      p_property_id: data.unit_id,
      p_utility_type: data.utility_type,
      p_reading_date: data.reading_date,
      p_meter_reading: data.meter_reading,
      p_previous_reading: data.previous_reading,
      p_rate: data.rate,
    });
  },

  bulkImport: async (readings: Array<{
    unit_id: string;
    utility_type: string;
    reading_date: string;
    meter_reading: number;
    previous_reading: number;
    rate: number;
  }>) => {
    const results = [];
    for (const reading of readings) {
      const result = await utilityApi.addReading(reading);
      results.push(result);
    }
    return results;
  },

  getPayments: async (params?: { estateId?: string; unit_id?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('payments')
      .select(params?.estateId ? '*, units!inner(estate_id, organization_id)' : '*, units(organization_id)', { count: 'exact' })
      .order('payment_date', { ascending: false });

    if (params?.estateId) query = query.eq('units.estate_id', params.estateId);
    if (params?.unit_id) query = query.eq('unit_id', params.unit_id);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  recordPayment: async (data: {
    unit_id: string;
    amount: number;
    payment_date: string;
    payment_method: string;
    reference: string;
    allocated_to?: any;
    receipt_url?: string;
  }) => {
    // NOTE: the underlying RPC's parameter is still named p_property_id (see addReading).
    return supabase.rpc('rpc_record_payment', {
      p_property_id: data.unit_id,
      p_amount: data.amount,
      p_payment_date: data.payment_date,
      p_payment_method: data.payment_method,
      p_reference: data.reference,
      p_allocated_to: data.allocated_to || {},
      p_receipt_url: data.receipt_url,
    });
  },

  getBilling: async (_unitId: string, estateId?: string) => {
    // billing_cycles is estate-wide (no unit_id FK).
    // Return the most recent open/published cycle for the estate.
    let query = supabase
      .schema('native_estate')
      .from('billing_cycles')
      .select('*')
      .in('status', ['OPEN', 'PUBLISHED'])
      .order('start_date', { ascending: false });

    if (estateId) query = query.eq('estate_id', estateId);

    return query.limit(1).single();
  },
};

// =============================================================================
// Meeting API — direct Supabase queries for reads, RPC for writes
// =============================================================================
export const meetingApi = {
  getAll: async (params?: { estateId?: string; type?: string; status?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('meetings')
      .select('*, meeting_attendance(*)', { count: 'exact' })
      .order('scheduled_date', { ascending: false });

    if (params?.estateId) query = query.eq('estate_id', params.estateId);
    if (params?.type) query = query.eq('type', params.type);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('meetings')
      .select('*, meeting_attendance(*), resolutions(*)')
      .eq('id', id)
      .single();
  },

  create: async (data: { estate_id: string; title: string; type: string; description?: string; scheduled_date: string; location: string; required_quorum?: number; created_by_id: string }) => {
    return supabase
      .schema('native_estate')
      .from('meetings')
      .insert(data)
      .select()
      .single();
  },

  update: async (id: string, data: { title?: string; status?: string; minutes_url?: string; description?: string }) => {
    return supabase
      .schema('native_estate')
      .from('meetings')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  rsvp: async (meetingId: string, userId: string, rsvpStatus: string) => {
    return supabase
      .schema('native_estate')
      .from('meeting_attendance')
      .upsert({ meeting_id: meetingId, user_id: userId, rsvp_status: rsvpStatus })
      .select()
      .single();
  },

  getAttendance: async (meetingId: string) => {
    return supabase
      .schema('native_estate')
      .from('meeting_attendance')
      .select('*')
      .eq('meeting_id', meetingId);
  },

  recordAttendance: async (meetingId: string, attendees: Array<{ user_id: string; actual_attendance: boolean }>) => {
    return supabase
      .schema('native_estate')
      .from('meeting_attendance')
      .upsert(
        attendees.map((a) => ({ meeting_id: meetingId, ...a })),
        { onConflict: 'meeting_id,user_id' }
      );
  },

  createResolution: async (meetingId: string, data: { title: string; description: string; proposed_by: string }) => {
    return supabase
      .schema('native_estate')
      .from('resolutions')
      .insert({ meeting_id: meetingId, ...data })
      .select()
      .single();
  },

  voteOnResolution: async (resolutionId: string, vote: 'for' | 'against' | 'abstain') => {
    return supabase.rpc('rpc_vote_on_resolution', {
      p_resolution_id: resolutionId,
      p_vote: vote,
    });
  },

  getResolutionResults: async (resolutionId: string) => {
    return supabase
      .schema('native_estate')
      .from('resolutions')
      .select('votes_for, votes_against, votes_abstain')
      .eq('id', resolutionId)
      .single();
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('meetings')
      .delete()
      .eq('id', id);
  },
};

// =============================================================================
// Unit API — direct Supabase queries (formerly Property API)
// =============================================================================
export const unitApi = {
  getMyUnits: async (estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('units')
      .select('*, unit_ownerships!inner(user_id, ownership_type, is_active)')
      .eq('unit_ownerships.is_active', true);

    if (estateId) query = query.eq('estate_id', estateId);

    return query;
  },

  getAll: async (params?: { estateId?: string; unit_type?: string; search?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('units')
      .select('*, unit_ownerships(user_id, ownership_type, is_active)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.estateId) query = query.eq('estate_id', params.estateId);
    if (params?.unit_type) query = query.eq('unit_type', params.unit_type);
    if (params?.search) query = query.or(`unit_number.ilike.%${params.search}%,address.ilike.%${params.search}%`);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('units')
      .select('*, unit_ownerships(*), utility_readings(*), payments(*)')
      .eq('id', id)
      .single();
  },

  getHistory: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('unit_ownerships')
      .select('*')
      .eq('unit_id', id)
      .order('start_date', { ascending: false });
  },

  getOwners: async (id: string) => {
    // Fetch ownerships first
    const { data: ownerships, error } = await supabase
      .schema('native_estate')
      .from('unit_ownerships')
      .select('*')
      .eq('unit_id', id)
      .eq('is_active', true);

    if (error || !ownerships || ownerships.length === 0) {
      return { data: ownerships || [], error };
    }

    // Fetch user details from core.users for each owner
    const userIds = [...new Set(ownerships.map((o) => o.user_id))];
    const { data: users } = await supabase
      .schema('core')
      .from('users')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    const userMap = new Map((users || []).map((u) => [u.id, u]));
    const enriched = ownerships.map((o) => ({
      ...o,
      user: userMap.get(o.user_id) || null,
    }));

    return { data: enriched, error: null };
  },

  getAccessRequests: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('unit_access_requests')
      .select('*')
      .eq('unit_id', id)
      .order('created_at', { ascending: false });
  },

  create: async (data: { organization_id: string; estate_id: string; unit_number: string; address: string; unit_type: string; square_meters: number; occupants?: number }) => {
    return supabase
      .schema('native_estate')
      .from('units')
      .insert(data)
      .select()
      .single();
  },

  initiateTransfer: async (unitId: string, data: { requested_for_email: string; requested_records: string[] }) => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase
      .schema('native_estate')
      .from('unit_access_requests')
      .insert({
        unit_id: unitId,
        requested_by_user_id: user?.id,
        requested_for_email: data.requested_for_email,
        requested_records: data.requested_records,
      })
      .select()
      .single();
  },

  approveAccessRequest: async (requestId: string, adminNotes?: string) => {
    return supabase.rpc('rpc_approve_access_request', {
      p_request_id: requestId,
      p_admin_notes: adminNotes,
    });
  },

  update: async (id: string, data: { address?: string; unit_type?: string; square_meters?: number; occupants?: number }) => {
    return supabase
      .schema('native_estate')
      .from('units')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('units')
      .delete()
      .eq('id', id);
  },
};

// =============================================================================
// User API — direct Supabase queries on core schema
// =============================================================================
export const userApi = {
  getAll: async (params?: { role?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('core')
      .from('users')
      .select('*', { count: 'exact' });

    if (params?.role) query = query.eq('role', params.role);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('core')
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
  },

  create: async (data: { email: string; first_name: string; last_name: string; phone_number?: string }) => {
    return supabase.rpc('rpc_create_user', {
      p_email: data.email,
      p_first_name: data.first_name,
      p_last_name: data.last_name,
      p_phone_number: data.phone_number,
    });
  },

  update: async (id: string, data: { first_name?: string; last_name?: string; phone_number?: string; is_active?: boolean }) => {
    return supabase.rpc('rpc_update_user', {
      p_user_id: id,
      p_first_name: data.first_name,
      p_last_name: data.last_name,
      p_phone_number: data.phone_number,
      p_is_active: data.is_active,
    });
  },

  delete: async (id: string) => {
    return supabase.rpc('rpc_delete_user', { p_user_id: id });
  },

  getActivity: async (id: string, params?: { limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('activity_logs')
      .select('*')
      .eq('user_id', id)
      .order('timestamp', { ascending: false });

    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },
};

// =============================================================================
// Maintenance API — direct Supabase queries for reads, RPC for admin writes
// =============================================================================
export const maintenanceApi = {
  getAll: async (params?: { estateId?: string; status?: string; unit_id?: string; limit?: number; offset?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('maintenance_requests')
      .select(
        params?.estateId ? '*, units!inner(unit_number, estate_id, organization_id)' : '*, units(unit_number, organization_id)',
        { count: 'exact' }
      )
      .order('submitted_at', { ascending: false });

    if (params?.estateId) query = query.eq('units.estate_id', params.estateId);
    if (params?.status) query = query.eq('status', params.status);
    if (params?.unit_id) query = query.eq('unit_id', params.unit_id);
    if (params?.limit) query = query.range(params.offset || 0, (params.offset || 0) + params.limit - 1);

    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('maintenance_requests')
      .select('*')
      .eq('id', id)
      .single();
  },

  create: async (data: { unit_id: string; category: string; priority: string; description: string; photos?: string[]; submitted_by_id: string }) => {
    return supabase
      .schema('native_estate')
      .from('maintenance_requests')
      .insert(data)
      .select()
      .single();
  },

  update: async (id: string, data: { status?: string; assigned_to?: string; estimated_cost?: number; actual_cost?: number; priority?: string }) => {
    return supabase.rpc('rpc_update_maintenance', {
      p_request_id: id,
      p_status: data.status,
      p_assigned_to: data.assigned_to,
      p_estimated_cost: data.estimated_cost,
      p_actual_cost: data.actual_cost,
      p_priority: data.priority,
    });
  },

  addFeedback: async (id: string, data: { rating: number; feedback: string }) => {
    return supabase
      .schema('native_estate')
      .from('maintenance_requests')
      .update({ rating: data.rating, feedback: data.feedback })
      .eq('id', id)
      .select()
      .single();
  },

  getStats: async (estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('maintenance_requests')
      .select(estateId ? 'status, submitted_at, resolved_at, units!inner(estate_id)' : 'status, submitted_at, resolved_at');

    if (estateId) query = query.eq('units.estate_id', estateId);

    const response = await query;

    if (response.error || !response.data) {
      return response;
    }

    const byStatus = response.data.reduce<Record<string, number>>((acc, row: any) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});

    const resolutionDays = response.data
      .filter((row: any) => row.resolved_at)
      .map((row: any) => (new Date(row.resolved_at!).getTime() - new Date(row.submitted_at).getTime()) / 86400000);
    const averageResolutionDays = resolutionDays.length
      ? resolutionDays.reduce((sum, d) => sum + d, 0) / resolutionDays.length
      : 0;

    return { ...response, data: { byStatus, averageResolutionDays } };
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('maintenance_requests')
      .delete()
      .eq('id', id);
  },
};

// =============================================================================
// Financial API — direct Supabase queries for reads, RPC for writes
// =============================================================================
export const financialApi = {
  getOverview: async (params?: { estateId?: string; accounting_period?: string }) => {
    let query = supabase
      .schema('native_estate')
      .from('financial_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (params?.estateId) query = query.eq('estate_id', params.estateId);
    if (params?.accounting_period) query = query.eq('accounting_period', params.accounting_period);

    return query;
  },

  createTransaction: async (data: { organization_id: string; date: string; type: string; category: string; description: string; amount: number; reference?: string; attachment_url?: string }) => {
    return supabase.rpc('rpc_create_transaction', {
      p_organization_id: data.organization_id,
      p_date: data.date,
      p_type: data.type,
      p_category: data.category,
      p_description: data.description,
      p_amount: data.amount,
      p_reference: data.reference,
      p_attachment_url: data.attachment_url,
    });
  },

  getBudget: async (params?: { estateId?: string; fiscal_year?: number }) => {
    let query = supabase
      .schema('native_estate')
      .from('budget_lines')
      .select('*')
      .order('category');

    if (params?.estateId) query = query.eq('estate_id', params.estateId);
    if (params?.fiscal_year) query = query.eq('fiscal_year', params.fiscal_year);

    return query;
  },

  createBudget: async (data: { organization_id: string; fiscal_year: number; category: string; budgeted_amount: number }) => {
    return supabase.rpc('rpc_create_budget_line', {
      p_organization_id: data.organization_id,
      p_fiscal_year: data.fiscal_year,
      p_category: data.category,
      p_budgeted_amount: data.budgeted_amount,
    });
  },

  updateBudget: async (id: string, data: { budgeted_amount?: number; spent_amount?: number }) => {
    return supabase.rpc('rpc_update_budget_line', {
      p_budget_id: id,
      p_budgeted_amount: data.budgeted_amount,
      p_spent_amount: data.spent_amount,
    });
  },
};

// =============================================================================
// Director API — direct Supabase queries
// =============================================================================
async function enrichDirectorsWithUsers(directors: any[] | null, error: any) {
  if (error || !directors || directors.length === 0) {
    return { data: directors || [], error };
  }

  const userIds = [...new Set(directors.map((d) => d.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    return { data: directors, error: null };
  }

  const { data: users } = await supabase
    .schema('core')
    .from('users')
    .select('id, first_name, last_name, email')
    .in('id', userIds);

  const userMap = new Map((users || []).map((u) => [u.id, u]));
  const enriched = directors.map((d) => ({
    ...d,
    user: userMap.get(d.user_id) || null,
  }));

  return { data: enriched, error: null };
}

export const directorApi = {
  getAll: async (estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('directors')
      .select('*')
      .order('elected_date', { ascending: false });
    if (estateId) query = query.eq('estate_id', estateId);
    const { data, error } = await query;
    return enrichDirectorsWithUsers(data, error);
  },

  getActive: async (estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('directors')
      .select('*')
      .eq('is_active', true)
      .order('term_end_date');
    if (estateId) query = query.eq('estate_id', estateId);
    const { data, error } = await query;
    return enrichDirectorsWithUsers(data, error);
  },

  getExpiring: async (estateId?: string) => {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    let query = supabase
      .schema('native_estate')
      .from('directors')
      .select('*')
      .eq('is_active', true)
      .lte('term_end_date', threeMonthsFromNow.toISOString())
      .order('term_end_date');
    if (estateId) query = query.eq('estate_id', estateId);
    const { data, error } = await query;
    return enrichDirectorsWithUsers(data, error);
  },

  getByPosition: async (position: string, estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('directors')
      .select('*')
      .eq('position', position)
      .eq('is_active', true);
    if (estateId) query = query.eq('estate_id', estateId);
    const { data, error } = await query;
    return enrichDirectorsWithUsers(data, error);
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .schema('native_estate')
      .from('directors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return { data, error };
    }

    const enriched = await enrichDirectorsWithUsers([data], null);
    return { data: enriched.data[0] || null, error: null };
  },

  create: async (data: { organization_id: string; user_id: string; position: string; elected_date: string; term_end_date: string; portfolio?: string; biography?: string; contact_email?: string }) => {
    return supabase.rpc('rpc_create_director', {
      p_organization_id: data.organization_id,
      p_user_id: data.user_id,
      p_position: data.position,
      p_elected_date: data.elected_date,
      p_term_end_date: data.term_end_date,
      p_portfolio: data.portfolio,
      p_biography: data.biography,
      p_contact_email: data.contact_email,
    });
  },

  update: async (id: string, data: { position?: string; term_end_date?: string; portfolio?: string; biography?: string; is_active?: boolean }) => {
    return supabase
      .schema('native_estate')
      .from('directors')
      .update(data)
      .eq('id', id)
      .select()
      .single();
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('directors')
      .delete()
      .eq('id', id);
  },
};

// =============================================================================
// Election API — direct Supabase queries for reads, RPC for writes
// =============================================================================
export const electionApi = {
  getAll: async (estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('elections')
      .select('*, candidates(*)')
      .order('created_at', { ascending: false });
    if (estateId) query = query.eq('estate_id', estateId);
    return query;
  },

  getActive: async (estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('elections')
      .select('*, candidates(*)')
      .in('status', ['NOMINATIONS_OPEN', 'VOTING_OPEN'])
      .order('voting_end_date');
    if (estateId) query = query.eq('estate_id', estateId);
    return query;
  },

  getByStatus: async (status: string, estateId?: string) => {
    let query = supabase
      .schema('native_estate')
      .from('elections')
      .select('*, candidates(*)')
      .eq('status', status)
      .order('created_at', { ascending: false });
    if (estateId) query = query.eq('estate_id', estateId);
    return query;
  },

  getById: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('elections')
      .select('*, candidates(*, vote_choices(*))')
      .eq('id', id)
      .single();
  },

  getResults: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('vote_choices')
      .select('*, candidates(user_id, position)')
      .eq('election_id', id)
      .order('vote_count', { ascending: false });
  },

  create: async (data: { organization_id: string; title: string; description?: string; type: string; nominations_start_date: string; nominations_end_date: string; voting_start_date: string; voting_end_date: string }) => {
    return supabase.rpc('rpc_create_election', {
      p_organization_id: data.organization_id,
      p_title: data.title,
      p_description: data.description,
      p_type: data.type,
      p_nominations_start: data.nominations_start_date,
      p_nominations_end: data.nominations_end_date,
      p_voting_start: data.voting_start_date,
      p_voting_end: data.voting_end_date,
    });
  },

  update: async (id: string, data: { title?: string; description?: string; status?: string }) => {
    if (data.status) {
      return supabase.rpc('rpc_update_election_status', {
        p_election_id: id,
        p_new_status: data.status,
      });
    }
    return supabase
      .schema('native_estate')
      .from('elections')
      .update({ title: data.title, description: data.description })
      .eq('id', id)
      .select()
      .single();
  },

  delete: async (id: string) => {
    return supabase
      .schema('native_estate')
      .from('elections')
      .delete()
      .eq('id', id);
  },

  nominate: async (electionId: string, data: { user_id: string; position: string; statement?: string }) => {
    return supabase.rpc('rpc_nominate_candidate', {
      p_election_id: electionId,
      p_user_id: data.user_id,
      p_position: data.position,
      p_statement: data.statement,
    });
  },

  secondNomination: async (candidateId: string) => {
    return supabase.rpc('rpc_second_nomination', { p_candidate_id: candidateId });
  },

  withdrawNomination: async (candidateId: string) => {
    return supabase.rpc('rpc_withdraw_nomination', { p_candidate_id: candidateId });
  },
};

// =============================================================================
// Voting API — RPC-based for all trust-sensitive operations
// =============================================================================
export const votingApi = {
  castVote: async (data: { election_id: string; candidate_id: string }) => {
    return supabase.rpc('rpc_cast_vote', {
      p_election_id: data.election_id,
      p_candidate_id: data.candidate_id,
    });
  },

  getStatus: async (electionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: votes } = await supabase
      .schema('native_estate')
      .from('votes')
      .select('candidate_id')
      .eq('election_id', electionId)
      .eq('user_id', user?.id || '');

    return {
      hasVoted: (votes?.length || 0) > 0,
      vote: votes?.[0],
    };
  },

  verify: async (voteId: string) => {
    return supabase.rpc('rpc_verify_vote', { p_vote_id: voteId });
  },

  getResults: async (electionId: string) => {
    return supabase
      .schema('native_estate')
      .from('vote_choices')
      .select('*, candidates(user_id, position)')
      .eq('election_id', electionId)
      .order('vote_count', { ascending: false });
  },

  getHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase
      .schema('native_estate')
      .from('votes')
      .select('*, elections(title, status)')
      .eq('user_id', user?.id || '')
      .order('created_at', { ascending: false });
  },
};
