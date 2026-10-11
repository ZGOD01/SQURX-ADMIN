import { API_BASE_URL } from '../config/api';
import type {
  JobFilterOptions,
  JobOptionItem,
  JobSettings,
  SyncLogItem,
  ApiUsage,
  JobStats,
  ApiResponse,
  ManageableCategory,
} from '../types/jobsAdmin';

function getHeaders(): HeadersInit {
  const token = sessionStorage.getItem('adminToken');
  return {
    'Authorization': `Bearer ${token || ''}`,
    'Content-Type': 'application/json',
  };
}

interface JsonPayload {
  message?: string;
  error?: string;
  errors?: Record<string, string[] | string>;
  data?: unknown;
  [key: string]: unknown;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    let json: JsonPayload | null = null;
    try {
      json = (await res.json()) as JsonPayload;
    } catch {
      // Non-JSON response
    }

    if (!res.ok) {
      const errorMessage =
        json?.message ||
        json?.error ||
        (res.status === 401
          ? 'Session expired. Please log in again.'
          : res.status === 403
          ? 'You do not have permission to perform this action.'
          : res.status === 409
          ? 'An option with this name already exists.'
          : res.status === 422
          ? 'Validation failed. Please check the values provided.'
          : `Server returned error (${res.status})`);

      return {
        success: false,
        statusCode: res.status,
        message: errorMessage,
        errors: json?.errors,
        data: (json?.data as T) ?? (null as unknown as T),
      };
    }

    return {
      success: true,
      statusCode: res.status,
      message: json?.message,
      data: (json?.data !== undefined ? json.data : json) as T,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error occurred. Please check your connection.';
    return {
      success: false,
      statusCode: 0,
      message,
      data: null as unknown as T,
    };
  }
}

interface OptionCategoryResponse {
  options?: JobOptionItem[];
  items?: JobOptionItem[];
  data?: JobOptionItem[];
}

interface SyncLogsResponse {
  logs?: SyncLogItem[];
  docs?: SyncLogItem[];
  items?: SyncLogItem[];
}

export const jobsAdminApi = {
  /**
   * Fetch all filter options used to populate filter controls
   * GET /admin/jobs/filter-options
   */
  async getFilterOptions(): Promise<ApiResponse<JobFilterOptions>> {
    return request<JobFilterOptions>('/admin/jobs/filter-options');
  },

  /**
   * Fetch option items for a specific manageable category
   * GET /admin/jobs/filter-options/:category
   */
  async getCategoryOptions(category: ManageableCategory): Promise<ApiResponse<JobOptionItem[]>> {
    const res = await request<JobOptionItem[] | OptionCategoryResponse>(
      `/admin/jobs/filter-options/${category}`
    );
    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        return { ...res, data: res.data };
      }
      const list = res.data.options || res.data.items || res.data.data || [];
      return { ...res, data: list };
    }
    return { ...res, data: [] };
  },

  /**
   * Create a new filter option item in a manageable category
   * POST /admin/jobs/filter-options/:category
   * Body: { name: "value" }
   */
  async createCategoryOption(
    category: ManageableCategory,
    name: string
  ): Promise<ApiResponse<JobOptionItem>> {
    return request<JobOptionItem>(`/admin/jobs/filter-options/${category}`, {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
  },

  /**
   * Update (rename or toggle active status) an option item
   * PATCH /admin/jobs/filter-options/:category/:id
   * Body: { name?: string, isActive?: boolean }
   */
  async updateCategoryOption(
    category: ManageableCategory,
    id: string,
    payload: { name?: string; isActive?: boolean }
  ): Promise<ApiResponse<JobOptionItem>> {
    return request<JobOptionItem>(`/admin/jobs/filter-options/${category}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Delete an option item
   * DELETE /admin/jobs/filter-options/:category/:id
   */
  async deleteCategoryOption(
    category: ManageableCategory,
    id: string
  ): Promise<ApiResponse<null>> {
    return request<null>(`/admin/jobs/filter-options/${category}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Load existing job sync settings from the DB
   * GET /admin/jobs/settings
   */
  async getSettings(): Promise<ApiResponse<JobSettings>> {
    return request<JobSettings>('/admin/jobs/settings');
  },

  /**
   * Partially update job sync settings in the DB
   * PUT /admin/jobs/settings
   * Sends only changed/dirty fields
   */
  async updateSettings(partialPayload: Partial<JobSettings>): Promise<ApiResponse<JobSettings>> {
    return request<JobSettings>('/admin/jobs/settings', {
      method: 'PUT',
      body: JSON.stringify(partialPayload),
    });
  },

  /**
   * Trigger a manual Fantastic.jobs sync
   * POST /admin/jobs/sync/trigger
   */
  async triggerSync(
    type: string,
    timeFrame?: string,
    filters?: Record<string, unknown>,
    maxJobs?: number
  ): Promise<ApiResponse<{ message?: string }>> {
    const body: Record<string, unknown> = { type };
    if (timeFrame && timeFrame.trim()) {
      body.timeFrame = timeFrame.trim();
    }
    if (filters && Object.keys(filters).length > 0) {
      body.filters = filters;
    }
    if (typeof maxJobs === 'number' && maxJobs > 0) {
      body.maxJobs = maxJobs;
    }
    return request<{ message?: string }>('/admin/jobs/sync/trigger', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  /**
   * Fetch recent sync activity logs
   * GET /admin/jobs/sync-logs
   */
  async getSyncLogs(params?: { jobType?: string }): Promise<ApiResponse<SyncLogItem[]>> {
    const q = new URLSearchParams();
    if (params?.jobType) q.set('jobType', params.jobType);
    const qs = q.toString();
    const endpoint = `/admin/jobs/sync-logs${qs ? `?${qs}` : ''}`;
    const res = await request<SyncLogItem[] | SyncLogsResponse>(endpoint);
    if (res.success && res.data) {
      if (Array.isArray(res.data)) {
        return { ...res, data: res.data };
      }
      const logs = res.data.logs || res.data.docs || res.data.items || [];
      return { ...res, data: logs };
    }
    return { ...res, data: [] };
  },

  /**
   * Fetch latest Fantastic.jobs credit/request usage
   * GET /admin/jobs/usage/latest
   */
  async getApiUsage(): Promise<ApiResponse<ApiUsage>> {
    return request<ApiUsage>('/admin/jobs/usage/latest');
  },

  /**
   * Fetch job count statistics (active & expired)
   * GET /admin/jobs/stats
   */
  async getJobStats(): Promise<ApiResponse<JobStats>> {
    return request<JobStats>('/admin/jobs/stats');
  },
};
