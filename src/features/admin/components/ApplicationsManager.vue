<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getAdminApplications, updateAdminApplicationStatus, exportApplications } from '@/features/admin/api/admin'
import { requestApplicationRevision } from '@/features/applications/api/applications'
import type { AdminApplicationListItem } from '@/features/admin/types/admin'
import { useRouter } from 'vue-router'
import { useConfirm } from "@/shared/composables/useConfirm.ts"
import Pagination from '@/shared/components/Pagination.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  filterCallId?: number | null
}>()

const emit = defineEmits(['clear-filter'])
const router = useRouter()

const ALL_STATUSES = [
  { value: 'draft', label: t('admin.applicationsManager.statuses.draft') },
  { value: 'submitted', label: t('admin.applicationsManager.statuses.submitted') },
  { value: 'formally_verified', label: t('admin.applicationsManager.statuses.formally_verified') },
  { value: 'under_evaluation', label: t('admin.applicationsManager.statuses.under_evaluation') },
  { value: 'pending_revision', label: t('admin.applicationsManager.statuses.pending_revision') },
  { value: 'approved', label: t('admin.applicationsManager.statuses.approved') },
  { value: 'rejected', label: t('admin.applicationsManager.statuses.rejected') },
  { value: 'onboarding', label: t('admin.applicationsManager.statuses.onboarding') },
  { value: 'active', label: t('admin.applicationsManager.statuses.active') },
  { value: 'suspended', label: t('admin.applicationsManager.statuses.suspended') },
  { value: 'closed', label: t('admin.applicationsManager.statuses.closed') },
]

const ALLOWED_ADMIN_ACTIONS = [
  { value: 'submitted', label: t('admin.applicationsManager.statuses.submitted') },
  { value: 'formally_verified', label: t('admin.applicationsManager.statuses.formally_verified') },
  { value: 'under_evaluation', label: t('admin.applicationsManager.statuses.under_evaluation') },
  { value: 'approved', label: t('admin.applicationsManager.statuses.approved') },
  { value: 'rejected', label: t('admin.applicationsManager.statuses.rejected') },
  { value: 'onboarding', label: t('admin.applicationsManager.statuses.onboarding') },
  { value: 'active', label: t('admin.applicationsManager.statuses.active') },
  { value: 'suspended', label: t('admin.applicationsManager.statuses.suspended') },
  { value: 'closed', label: t('admin.applicationsManager.statuses.closed') },
]

const PROGRAM_TYPES = [
  { value: 'a', label: t('admin.applicationsManager.programs.programA') },
  { value: 'b', label: t('admin.applicationsManager.programs.programB') },
]

const applications = ref<AdminApplicationListItem[]>([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const searchQuery = ref('')
const filterProgramType = ref('')
const filterStatus = ref('')
const changingStatusId = ref<number | null>(null)

const showRevisionModal = ref(false)
const revisionAppId = ref<number | null>(null)
const revisionMessage = ref('')
const revisionLoading = ref(false)

async function loadApplications() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    if (props.filterCallId) params.call_id = props.filterCallId
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (filterProgramType.value) params.program_type = filterProgramType.value
    if (filterStatus.value) params.status = filterStatus.value

    const res = await getAdminApplications(params)

    if (res.data && res.data.data) {
      applications.value = res.data.data
      currentPage.value = res.data.current_page
      totalPages.value = res.data.last_page
      totalItems.value = res.data.total
    } else {
      applications.value = Array.isArray(res.data) ? res.data : []
      totalPages.value = 1
      totalItems.value = applications.value.length
    }
  } catch (error) {
    console.error('Failed to load applications', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() { currentPage.value = 1; loadApplications() }
function handleFilterChange() { currentPage.value = 1; loadApplications() }

function changePage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadApplications()
}

async function handleStatusSelect(id: number, targetStatus: string) {
  if (targetStatus === 'request_revision') {
    revisionAppId.value = id
    revisionMessage.value = ''
    showRevisionModal.value = true
    return
  }
  changingStatusId.value = id
  try {
    await updateAdminApplicationStatus(id, targetStatus)
    const app = applications.value.find(a => a.id === id)
    if (app) app.status = targetStatus
  } catch {
    await useConfirm({ 
      title: t('admin.applicationsManager.confirm.errorTitle'), 
      message: t('admin.applicationsManager.confirm.statusError'), 
      confirmText: t('admin.applicationsManager.confirm.okay'), 
      danger: false 
    })
    loadApplications()
  } finally {
    changingStatusId.value = null
  }
}

async function submitRevision() {
  if (!revisionMessage.value.trim() || !revisionAppId.value) return
  revisionLoading.value = true
  try {
    await requestApplicationRevision(revisionAppId.value, revisionMessage.value.trim())
    const app = applications.value.find(a => a.id === revisionAppId.value)
    if (app) app.status = 'pending_revision'
    showRevisionModal.value = false
  } catch {
    await useConfirm({ 
      title: t('admin.applicationsManager.confirm.errorTitle'), 
      message: t('admin.applicationsManager.confirm.revisionError'), 
      confirmText: t('admin.applicationsManager.confirm.okay'), 
      danger: false 
    })
  } finally {
    revisionLoading.value = false
  }
}

function viewDetail(id: number) {
  router.push(`/applications/${id}`)
}

async function downloadExport(format: 'csv' | 'xlsx' = 'xlsx') {
  try {
    const params: any = { format }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (props.filterCallId) params.call_id = props.filterCallId
    if (filterProgramType.value) params.program_type = filterProgramType.value
    if (filterStatus.value) params.status = filterStatus.value

    const response = await exportApplications(params)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `applications.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch {
    await useConfirm({ 
      title: t('admin.applicationsManager.confirm.errorTitle'), 
      message: t('admin.applicationsManager.confirm.exportError'), 
      confirmText: t('admin.applicationsManager.confirm.okay'), 
      danger: false 
    })
  }
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-slate-900 text-slate-600 border-slate-800',
    submitted: 'bg-blue-950/60 text-blue-400 border-blue-900',
    formally_verified: 'bg-amber-950/40 text-amber-400 border-amber-900',
    under_evaluation: 'bg-indigo-950/60 text-indigo-400 border-indigo-900',
    approved: 'bg-emerald-950/60 text-emerald-400 border-emerald-900',
    active: 'bg-emerald-950/60 text-emerald-400 border-emerald-900',
    rejected: 'bg-red-950/40 text-red-400 border-red-900',
    pending_revision: 'bg-amber-950/40 text-amber-500 border-amber-900',
    onboarding: 'bg-orange-950/40 text-orange-400 border-orange-900',
    suspended: 'bg-rose-950/40 text-rose-400 border-rose-900',
    closed: 'bg-slate-800/80 text-slate-500 border-slate-700',
  }
  return map[status] ?? 'bg-slate-900 text-slate-600 border-slate-800'
}

onMounted(() => loadApplications())
watch(() => props.filterCallId, () => { currentPage.value = 1; loadApplications() })
</script>

<template>
  <div class="border border-slate-800 bg-slate-900/20 rounded-2xl p-6 space-y-6">

    <!-- Header -->
    <div class="flex flex-wrap justify-between items-start gap-3">
      <div>
        <h3 class="text-xl font-bold text-white">{{ t('admin.applicationsManager.title') }}</h3>
        <p
          v-if="filterCallId"
          class="mt-2 inline-flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-950/30 border border-blue-900/50 px-2 py-1 rounded-md"
        >
          <span>{{ t('admin.applicationsManager.filterNotice', { id: filterCallId }) }}</span>
          <button @click="$emit('clear-filter')" class="text-slate-400 hover:text-white underline">
            {{ t('admin.applicationsManager.buttons.clearFilter') }}
          </button>
        </p>
      </div>

      <div class="flex gap-2 flex-shrink-0">
        <button
          @click="downloadExport('csv')"
          :disabled="loading"
          class="text-xs bg-green-900/40 hover:bg-green-900/60 px-3 py-1.5 rounded text-green-400 border border-green-800 transition-all font-mono disabled:opacity-40"
        >
          {{ t('admin.applicationsManager.buttons.exportCSV') }}
        </button>
        <button
          @click="downloadExport('xlsx')"
          :disabled="loading"
          class="text-xs bg-blue-900/40 hover:bg-blue-900/60 px-3 py-1.5 rounded text-blue-400 border border-blue-800 transition-all font-mono disabled:opacity-40"
        >
          {{ t('admin.applicationsManager.buttons.exportXLSX') }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div class="sm:col-span-2">
        <input
          v-model="searchQuery"
          @input="handleSearch"
          :placeholder="t('admin.applicationsManager.filters.searchPlaceholder')"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-600 outline-none"
        />
      </div>
      <div>
        <select
          v-model="filterProgramType"
          @change="handleFilterChange"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        >
          <option value="">{{ t('admin.applicationsManager.filters.allPrograms') }}</option>
          <option v-for="type in PROGRAM_TYPES" :key="type.value" :value="type.value" class="bg-slate-950">
            {{ type.label }}
          </option>
        </select>
      </div>
      <div>
        <select
          v-model="filterStatus"
          @change="handleFilterChange"
          class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-600 outline-none"
        >
          <option value="">{{ t('admin.applicationsManager.filters.allStatuses') }}</option>
          <option v-for="s in ALL_STATUSES" :key="s.value" :value="s.value" class="bg-slate-950">
            {{ s.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading && applications.length === 0" class="text-slate-500 italic text-sm py-6 text-center animate-pulse">
      {{ t('admin.applicationsManager.status.loading') }}
    </div>

    <div v-else>
      <!-- Empty -->
      <div v-if="applications.length === 0" class="text-slate-500 italic text-sm py-6 text-center">
        {{ t('admin.applicationsManager.status.empty') }}
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-900/80">
              <th class="px-4 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">{{ t('admin.applicationsManager.table.id') }}</th>
              <th class="px-4 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">{{ t('admin.applicationsManager.table.applicant') }}</th>
              <th class="px-4 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">{{ t('admin.applicationsManager.table.programCall') }}</th>
              <th class="px-4 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider">{{ t('admin.applicationsManager.table.status') }}</th>
              <th class="px-4 py-3 text-xs font-mono uppercase text-slate-500 tracking-wider text-right">{{ t('admin.applicationsManager.table.actions') }}</th>
            </tr>
          </thead>
          <tbody class="bg-slate-950">
            <tr
              v-for="application in applications"
              :key="application.id"
              class="border-t border-slate-800 hover:bg-slate-900/40 transition"
            >
              <td class="px-4 py-4 font-mono text-xs text-slate-500">#{{ application.id }}</td>

              <td class="px-4 py-4">
                <div class="font-semibold text-white text-sm">{{ application.applicant_type == 'team' ? application.team.name : application.student_profile.user.first_name + ' ' + application.student_profile.user.last_name }}</div>
                <div class="text-xs text-slate-500 font-mono mt-0.5">{{ application.student_profile.user.email }}</div>
              </td>

              <td class="px-4 py-4">
                <span
                  class="text-xs font-mono px-2 py-1 rounded border uppercase"
                  :class="application.program_type?.toLowerCase() === 'a'
                    ? 'bg-blue-950/60 text-blue-400 border-blue-900'
                    : 'bg-slate-800 text-slate-400 border-slate-700'"
                >
                  {{ t('admin.applicationsManager.programs.labelPrefix') }} {{ application.program_type }}
                </span>
                <div class="text-xs text-slate-500 font-mono mt-1">{{ application.call_name }}</div>
              </td>

              <td class="px-4 py-4">
                <span
                  :class="statusColor(application.status)"
                  class="text-xs font-mono px-2 py-1 rounded border uppercase"
                >
                  {{ changingStatusId === application.id ? '...' : application.status }}
                </span>
              </td>

              <td class="pr-4 py-4 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="router.push(`/evaluations/application/${application.id}/final-verdict`)"
                    v-if="application.status == 'under_evaluation'"
                    class="text-sm bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded border border-blue-700 text-slate-300 transition font-mono"
                  >
                    {{ t('admin.applicationsManager.buttons.finalVerdict') }}
                  </button>

                  <button
                    @click="viewDetail(application.id)"
                    class="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded border border-slate-700 text-slate-300 transition font-mono"
                  >
                    {{ t('admin.applicationsManager.buttons.detail') }}
                  </button>

                  <select
                    :value="application.status === 'draft' || application.status === 'pending_revision' ? '' : application.status"
                    @change="handleStatusSelect(application.id, ($event.target as HTMLSelectElement).value)"
                    :disabled="changingStatusId === application.id || application.status === 'draft'"
                    class="text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded px-2 py-2 outline-none focus:border-blue-600 transition disabled:opacity-40 font-mono"
                  >
                    <option value="" disabled class="text-slate-500">
                      {{ application.status === 'draft' ? t('admin.applicationsManager.select.draftReadOnly') : t('admin.applicationsManager.select.placeholder') }}
                    </option>
                    <option v-for="s in ALLOWED_ADMIN_ACTIONS" :key="s.value" :value="s.value" class="bg-slate-950">
                      {{ s.label }}
                    </option>
                    <option value="request_revision" class="bg-slate-950 text-amber-400">
                      {{ t('admin.applicationsManager.select.returnRevision') }}
                    </option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <Pagination
          :current-page="currentPage"
          :total-pages="totalPages"
          :total-items="totalItems"
          :loading="loading"
          @change="changePage"
          class="mt-4"
      />
    </div>
  </div>

  <!-- Revision Modal -->
  <div
    v-if="showRevisionModal"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <div class="border border-slate-800 bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
      <h3 class="text-xl font-bold text-white mb-1">{{ t('admin.applicationsManager.modal.title') }}</h3>
      <p class="text-xs font-mono text-slate-500 mb-4">#{{ revisionAppId }} — {{ t('admin.applicationsManager.modal.subtitle') }}</p>

      <textarea
        v-model="revisionMessage"
        rows="4"
        :placeholder="t('admin.applicationsManager.modal.placeholder')"
        class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white placeholder:text-slate-600 focus:border-blue-600 outline-none resize-none transition"
      ></textarea>

      <div class="flex gap-3 mt-4">
        <button
          @click="showRevisionModal = false"
          :disabled="revisionLoading"
          class="w-1/3 bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          {{ t('admin.applicationsManager.modal.cancel') }}
        </button>
        <button
          @click="submitRevision"
          :disabled="revisionLoading || !revisionMessage.trim()"
          class="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm"
        >
          {{ revisionLoading ? t('admin.applicationsManager.modal.sending') : t('admin.applicationsManager.modal.submit') }}
        </button>
      </div>
    </div>
  </div>
</template>