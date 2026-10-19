import { Search, Building, Cpu, Calendar, Settings } from 'lucide-react';
import type {
  JobFilters,
  JobResponseOptions,
  JobFilterOptions,
} from '../../types/jobsAdmin';
import MultiSelectCombobox from './MultiSelectCombobox';
import SingleSelectUnset from './SingleSelectUnset';
import TooltipBadge from './TooltipBadge';

type NumericFilterKeys =
  | 'organizationHeadcountGte'
  | 'organizationHeadcountLt'
  | 'organizationFundingGte'
  | 'organizationFundingLt';

type DateFilterKeys =
  | 'datePostedGte'
  | 'datePostedLt'
  | 'dateCreatedGte'
  | 'dateCreatedLt';

interface JobsFiltersSectionProps {
  filters: JobFilters;
  responseOptions: JobResponseOptions;
  onFilterChange: <K extends keyof JobFilters>(field: K, value: JobFilters[K]) => void;
  onResponseOptionChange: <K extends keyof JobResponseOptions>(
    field: K,
    value: JobResponseOptions[K]
  ) => void;
  filterOptions: JobFilterOptions;
  onOptionCreated?: () => void;
}

export default function JobsFiltersSection({
  filters,
  responseOptions,
  onFilterChange,
  onResponseOptionChange,
  filterOptions,
  onOptionCreated,
}: JobsFiltersSectionProps) {
  // Safe number input change
  const handleNumberChange = (
    field: NumericFilterKeys,
    rawVal: string
  ) => {
    if (rawVal.trim() === '') {
      onFilterChange(field, null);
    } else {
      const parsed = Number(rawVal);
      onFilterChange(field, isNaN(parsed) ? null : parsed);
    }
  };

  // Safe date input change (formats ISO or null)
  const handleDateChange = (field: DateFilterKeys, dateStr: string) => {
    if (!dateStr) {
      onFilterChange(field, null);
    } else {
      try {
        const iso = new Date(dateStr).toISOString();
        onFilterChange(field, iso);
      } catch {
        onFilterChange(field, null);
      }
    }
  };

  const toDateInputValue = (isoStr: string | null): string => {
    if (!isoStr) return '';
    try {
      return isoStr.split('T')[0];
    } catch {
      return '';
    }
  };

  // Prepare country option names for location multi-select safely
  const countryOptions = (filterOptions.countries || [])
    .map((c) => (typeof c === 'string' ? c : (c?.name || c?.code || '')))
    .filter(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── 1. Text & Keyword Search ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Text & Keyword Search</h2>
            <p className="text-xs text-gray-500">
              Query matching rules for job titles, descriptions, organizations, and locations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={filters.title || ''}
              onChange={(e) => onFilterChange('title', e.target.value)}
              placeholder="e.g. Software Engineer, React Developer"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Title Advanced (Boolean query)
            </label>
            <input
              type="text"
              value={filters.titleAdvanced || ''}
              onChange={(e) => onFilterChange('titleAdvanced', e.target.value)}
              placeholder="e.g. ('Frontend' OR 'Fullstack') AND 'React'"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Description Keyword
            </label>
            <input
              type="text"
              value={filters.description || ''}
              onChange={(e) => onFilterChange('description', e.target.value)}
              placeholder="e.g. Next.js, GraphQL, AWS"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Description Advanced (Boolean query)
            </label>
            <input
              type="text"
              value={filters.descriptionAdvanced || ''}
              onChange={(e) => onFilterChange('descriptionAdvanced', e.target.value)}
              placeholder="e.g. 'Kubernetes' AND NOT 'Contract'"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Location (Countries & Cities)
            </label>
            <MultiSelectCombobox
              values={filters.location || []}
              onChange={(v) => onFilterChange('location', v)}
              availableOptions={countryOptions}
              placeholder="Type city or select country..."
              allowFreeTextWithoutCategory={true}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Use full country names (for example "United States", not "US"). Several locations are combined with OR.
            </p>
            {filters.hasNoLocation && (
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                Note: "Has No Location" cannot be combined with Location.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Location Advanced (Query)
            </label>
            <input
              type="text"
              value={filters.locationAdvanced || ''}
              onChange={(e) => onFilterChange('locationAdvanced', e.target.value)}
              placeholder="e.g. 'United States' OR 'Remote'"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Include Organizations
            </label>
            <MultiSelectCombobox
              values={filters.organization || []}
              onChange={(v) => onFilterChange('organization', v)}
              placeholder="Add organization names (press enter)..."
              allowFreeTextWithoutCategory={true}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Exclude Organizations
            </label>
            <MultiSelectCombobox
              values={filters.excludeOrganization || []}
              onChange={(v) => onFilterChange('excludeOrganization', v)}
              placeholder="Add organizations to exclude..."
              allowFreeTextWithoutCategory={true}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Organization Advanced (Boolean query)
            </label>
            <input
              type="text"
              value={filters.organizationAdvanced || ''}
              onChange={(e) => onFilterChange('organizationAdvanced', e.target.value)}
              placeholder="e.g. ('Google' OR 'Stripe') AND NOT 'Agency'"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Source & Organization Details ────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Source & Organization Details</h2>
            <p className="text-xs text-gray-500">
              Filter by ATS platforms, industries, headcount, agency status, and funding
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Include Sources
            </label>
            <MultiSelectCombobox
              values={filters.sources || []}
              onChange={(v) => onFilterChange('sources', v)}
              availableOptions={filterOptions.sources}
              category="sources"
              categoryLabel="Sources"
              placeholder="Select job sources..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Exclude Sources
            </label>
            <MultiSelectCombobox
              values={filters.excludeSources || []}
              onChange={(v) => onFilterChange('excludeSources', v)}
              availableOptions={filterOptions.sources}
              category="sources"
              categoryLabel="Sources"
              placeholder="Select sources to exclude..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Include Domain
              </label>
              <TooltipBadge type="ats" />
            </div>
            <MultiSelectCombobox
              values={filters.domain || []}
              onChange={(v) => onFilterChange('domain', v)}
              placeholder="Add domains e.g. stripe.com..."
              allowFreeTextWithoutCategory={true}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Exclude Domain
              </label>
              <TooltipBadge type="ats" />
            </div>
            <MultiSelectCombobox
              values={filters.excludeDomain || []}
              onChange={(v) => onFilterChange('excludeDomain', v)}
              placeholder="Add domains to exclude..."
              allowFreeTextWithoutCategory={true}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Organization Industry
            </label>
            <MultiSelectCombobox
              values={filters.organizationIndustry || []}
              onChange={(v) => onFilterChange('organizationIndustry', v)}
              availableOptions={filterOptions.organizationIndustry}
              category="organizationIndustry"
              categoryLabel="Industries"
              placeholder="Select industries..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Exclude Organization Industry
            </label>
            <MultiSelectCombobox
              values={filters.excludeOrganizationIndustry || []}
              onChange={(v) => onFilterChange('excludeOrganizationIndustry', v)}
              availableOptions={filterOptions.organizationIndustry}
              category="organizationIndustry"
              categoryLabel="Industries"
              placeholder="Select industries to exclude..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Organization Slugs
            </label>
            <MultiSelectCombobox
              values={filters.organizationSlug || []}
              onChange={(v) => onFilterChange('organizationSlug', v)}
              placeholder="Add slugs e.g. google, microsoft..."
              allowFreeTextWithoutCategory={true}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Exclude Organization Slugs
            </label>
            <MultiSelectCombobox
              values={filters.excludeOrganizationSlug || []}
              onChange={(v) => onFilterChange('excludeOrganizationSlug', v)}
              placeholder="Add slugs to exclude..."
              allowFreeTextWithoutCategory={true}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Headcount Minimum (GTE)
            </label>
            <input
              type="number"
              min={0}
              value={filters.organizationHeadcountGte ?? ''}
              onChange={(e) => handleNumberChange('organizationHeadcountGte', e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Headcount Maximum (LT)
            </label>
            <input
              type="number"
              min={0}
              value={filters.organizationHeadcountLt ?? ''}
              onChange={(e) => handleNumberChange('organizationHeadcountLt', e.target.value)}
              placeholder="e.g. 1000"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Organization Size
            </label>
            <MultiSelectCombobox
              values={filters.organizationSize || []}
              onChange={(v) => onFilterChange('organizationSize', v)}
              availableOptions={filterOptions.organizationSize}
              category="organizationSize"
              categoryLabel="Organization Size"
              placeholder="Select headcount bucket..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Organization Agency
            </label>
            <SingleSelectUnset
              value={filters.organizationAgency}
              onChange={(v) => onFilterChange('organizationAgency', v)}
              options={filterOptions.organizationAgency}
              placeholder="Any / Unset"
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Funding Min USD (GTE)
              </label>
              <TooltipBadge type="ats" />
            </div>
            <input
              type="number"
              min={0}
              value={filters.organizationFundingGte ?? ''}
              onChange={(e) => handleNumberChange('organizationFundingGte', e.target.value)}
              placeholder="e.g. 1000000"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Funding Max USD (LT)
              </label>
              <TooltipBadge type="ats" />
            </div>
            <input
              type="number"
              min={0}
              value={filters.organizationFundingLt ?? ''}
              onChange={(e) => handleNumberChange('organizationFundingLt', e.target.value)}
              placeholder="e.g. 50000000"
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* ── 3. AI-Derived & Classification Filters ─────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI-Derived & Job Board Filters</h2>
            <p className="text-xs text-gray-500">
              Machine-extracted classifications including experience, remote arrangement, and visa status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Experience Level
            </label>
            <MultiSelectCombobox
              values={filters.aiExperienceLevel || []}
              onChange={(v) => onFilterChange('aiExperienceLevel', v)}
              availableOptions={filterOptions.aiExperienceLevel}
              category="aiExperienceLevel"
              categoryLabel="AI Experience Level"
              placeholder="Select experience levels..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Work Arrangement
            </label>
            <MultiSelectCombobox
              values={filters.aiWorkArrangement || []}
              onChange={(v) => onFilterChange('aiWorkArrangement', v)}
              availableOptions={filterOptions.aiWorkArrangement}
              category="aiWorkArrangement"
              categoryLabel="Work Arrangement"
              placeholder="Remote, hybrid, on-site..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Employment Type
            </label>
            <MultiSelectCombobox
              values={filters.aiEmploymentType || []}
              onChange={(v) => onFilterChange('aiEmploymentType', v)}
              availableOptions={filterOptions.aiEmploymentType}
              category="aiEmploymentType"
              categoryLabel="Employment Type"
              placeholder="Full-time, part-time, contract..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Language
            </label>
            <MultiSelectCombobox
              values={filters.aiLanguage || []}
              onChange={(v) => onFilterChange('aiLanguage', v)}
              availableOptions={filterOptions.aiLanguage}
              category="aiLanguage"
              categoryLabel="Language"
              placeholder="Select languages..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Education
            </label>
            <MultiSelectCombobox
              values={filters.aiEducation || []}
              onChange={(v) => onFilterChange('aiEducation', v)}
              availableOptions={filterOptions.aiEducation}
              category="aiEducation"
              categoryLabel="Education"
              placeholder="Degree requirements..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Visa Sponsorship
            </label>
            <SingleSelectUnset
              value={filters.aiVisaSponsorship}
              onChange={(v) => onFilterChange('aiVisaSponsorship', v)}
              options={filterOptions.aiVisaSponsorship}
              placeholder="Any / Unset"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Taxonomies Primary
            </label>
            <MultiSelectCombobox
              values={filters.aiTaxonomiesAPrimary || []}
              onChange={(v) => onFilterChange('aiTaxonomiesAPrimary', v)}
              availableOptions={filterOptions.aiTaxonomiesA}
              category="aiTaxonomiesA"
              categoryLabel="Taxonomies"
              placeholder="Select primary taxonomies..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              AI Taxonomies (All)
            </label>
            <MultiSelectCombobox
              values={filters.aiTaxonomiesA || []}
              onChange={(v) => onFilterChange('aiTaxonomiesA', v)}
              availableOptions={filterOptions.aiTaxonomiesA}
              category="aiTaxonomiesA"
              categoryLabel="Taxonomies"
              placeholder="Select taxonomies..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Exclude AI Taxonomies
            </label>
            <MultiSelectCombobox
              values={filters.excludeAiTaxonomiesA || []}
              onChange={(v) => onFilterChange('excludeAiTaxonomiesA', v)}
              availableOptions={filterOptions.aiTaxonomiesA}
              category="aiTaxonomiesA"
              categoryLabel="Taxonomies"
              placeholder="Select taxonomies to exclude..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Seniority
              </label>
              <TooltipBadge type="job-board" />
            </div>
            <MultiSelectCombobox
              values={filters.seniority || []}
              onChange={(v) => onFilterChange('seniority', v)}
              availableOptions={filterOptions.seniority}
              category="seniority"
              categoryLabel="Seniority"
              placeholder="Select seniority levels..."
              onOptionCreated={onOptionCreated}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Direct Apply
              </label>
              <TooltipBadge type="job-board" />
            </div>
            <SingleSelectUnset
              value={filters.directApply}
              onChange={(v) => onFilterChange('directApply', v)}
              options={filterOptions.directApply}
              placeholder="Any / Unset"
            />
          </div>
        </div>

        {/* Boolean Toggles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Has Salary</p>
              <p className="text-xs text-gray-500">Only sync jobs with salary data</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filters.hasSalary}
              onClick={() => onFilterChange('hasSalary', !filters.hasSalary)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                filters.hasSalary ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                  filters.hasSalary ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Has No Location</p>
              <p className="text-xs text-gray-500">Include locationless positions</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filters.hasNoLocation}
              onClick={() => onFilterChange('hasNoLocation', !filters.hasNoLocation)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                filters.hasNoLocation ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                  filters.hasNoLocation ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
            <div>
              <div className="flex items-center">
                <p className="text-sm font-semibold text-gray-900">Exclude ATS Duplicates</p>
                <TooltipBadge type="job-board" />
              </div>
              <p className="text-xs text-gray-500">Filter duplicate job board posts</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={filters.excludeAtsDuplicate}
              onClick={() => onFilterChange('excludeAtsDuplicate', !filters.excludeAtsDuplicate)}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                filters.excludeAtsDuplicate ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                  filters.excludeAtsDuplicate ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Date Posted & Created Ranges ────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Date Posted & Created Ranges</h2>
            <p className="text-xs text-gray-500">
              Restrict sync to jobs posted or created within specific calendar dates
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Date Posted &gt;= (GTE)
            </label>
            <input
              type="date"
              value={toDateInputValue(filters.datePostedGte)}
              onChange={(e) => handleDateChange('datePostedGte', e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Date Posted &lt; (LT)
            </label>
            <input
              type="date"
              value={toDateInputValue(filters.datePostedLt)}
              onChange={(e) => handleDateChange('datePostedLt', e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Date Created &gt;= (GTE)
            </label>
            <input
              type="date"
              value={toDateInputValue(filters.dateCreatedGte)}
              onChange={(e) => handleDateChange('dateCreatedGte', e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Date Created &lt; (LT)
            </label>
            <input
              type="date"
              value={toDateInputValue(filters.dateCreatedLt)}
              onChange={(e) => handleDateChange('dateCreatedLt', e.target.value)}
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* ── 5. Response Options ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-800 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Response Options</h2>
            <p className="text-xs text-gray-500">
              Payload format and optional metadata requested from Fantastic.jobs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Description Format
            </label>
            <select
              value={responseOptions.descriptionFormat || ''}
              onChange={(e) =>
                onResponseOptionChange(
                  'descriptionFormat',
                  e.target.value ? (e.target.value as 'text' | 'html') : null
                )
              }
              className="w-full bg-gray-50/50 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm text-gray-900 font-medium"
            >
              <option value="">Unset (Default)</option>
              <option value="text">Plain Text (text)</option>
              <option value="html">Rich HTML (html)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Include Basic Org Details</p>
              <p className="text-xs text-gray-500">Fetch logo, website & details</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={responseOptions.includeBasicOrganizationDetails}
              onClick={() =>
                onResponseOptionChange(
                  'includeBasicOrganizationDetails',
                  !responseOptions.includeBasicOrganizationDetails
                )
              }
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                responseOptions.includeBasicOrganizationDetails ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                  responseOptions.includeBasicOrganizationDetails
                    ? 'translate-x-6'
                    : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-900">Include Beta Fields</p>
              <p className="text-xs text-gray-500">Receive experimental attributes</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={responseOptions.includeBeta}
              onClick={() =>
                onResponseOptionChange('includeBeta', !responseOptions.includeBeta)
              }
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${
                responseOptions.includeBeta ? 'bg-black' : 'bg-gray-200'
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform duration-200 shadow-sm ${
                  responseOptions.includeBeta ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
