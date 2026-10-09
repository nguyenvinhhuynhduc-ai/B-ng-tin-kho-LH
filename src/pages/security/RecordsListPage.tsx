import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SelectField, TextField } from '../../components/ui/FormField';
import { useToast } from '../../components/ui/Toast';
import { vehicleService } from '../../services/vehicleService';
import type { VehicleFilters, VehicleRecord } from '../../types';
import { CONG_TY_OPTIONS } from '../../utils/constants';

const PAGE_SIZE = 10;

const INITIAL_FILTERS: VehicleFilters = {
  search: '',
  date: null,
  congTy: 'Tất cả',
  trangThai: 'Tất cả',
};

export function RecordsListPage() {
  const { showError } = useToast();
  const [filters, setFilters] = useState<VehicleFilters>(INITIAL_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { records, total } = await vehicleService.listRecords(filters, page, PAGE_SIZE);
      setRecords(records);
      setTotal(total);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Không thể tải danh sách.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  async function handleExport() {
    setExporting(true);
    try {
      const [all, { exportService }] = await Promise.all([
        vehicleService.listAllForExport(filters),
        import('../../services/exportService'),
      ]);
      exportService.exportToExcel(all);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Xuất Excel thất bại.');
    } finally {
      setExporting(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const activeFilterCount =
    (filters.date ? 1 : 0) + (filters.congTy !== 'Tất cả' ? 1 : 0) + (filters.trangThai !== 'Tất cả' ? 1 : 0);

  return (
    <div className="min-h-full pb-28">
      <PageHeader title="Danh sách xe" subtitle={`${total} bản ghi`} />

      <div className="-mt-2 space-y-3 px-4">
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-2xl border-2 border-gray-200 bg-gray-50 px-3">
              <Search size={18} className="text-gray-400" />
              <input
                className="h-12 w-full bg-transparent text-base outline-none placeholder:text-gray-400"
                placeholder="Tìm theo biển số xe hoặc số CCCD"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              />
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-gray-200 text-gray-600"
              aria-label="Bộ lọc"
            >
              <SlidersHorizontal size={20} />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              <TextField
                label="Theo ngày"
                type="date"
                value={filters.date ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value || null }))}
              />
              <SelectField
                label="Theo công ty"
                options={CONG_TY_OPTIONS}
                placeholder="Tất cả"
                value={filters.congTy === 'Tất cả' ? '' : filters.congTy}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    congTy: (e.target.value || 'Tất cả') as VehicleFilters['congTy'],
                  }))
                }
              />
              <SelectField
                label="Theo trạng thái"
                options={['Đang trong kho', 'Đã ra khỏi kho']}
                placeholder="Tất cả"
                value={filters.trangThai === 'Tất cả' ? '' : filters.trangThai}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    trangThai: (e.target.value || 'Tất cả') as VehicleFilters['trangThai'],
                  }))
                }
              />
              {activeFilterCount > 0 && (
                <button
                  onClick={() => setFilters(INITIAL_FILTERS)}
                  className="flex items-center gap-1 text-sm font-semibold text-orange-500"
                >
                  <X size={16} /> Xoá bộ lọc
                </button>
              )}
            </div>
          )}
        </Card>

        <Button
          variant="secondary"
          icon={<Download size={20} />}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Đang xuất...' : 'Xuất Excel'}
        </Button>

        {loading && <Card className="text-center text-sm text-gray-400">Đang tải...</Card>}

        {!loading && records.length === 0 && (
          <Card className="text-center text-sm text-gray-400">Không có bản ghi phù hợp.</Card>
        )}

        <div className="space-y-3">
          {records.map((r) => (
            <Card key={r.id} className="!p-4">
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-gray-900 px-2.5 py-1 text-sm font-bold tracking-wide text-white">
                  {r.bien_so_xe}
                </span>
                <span
                  className={[
                    'rounded-full px-2.5 py-1 text-xs font-bold',
                    r.trang_thai === 'Đang trong kho'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500',
                  ].join(' ')}
                >
                  {r.trang_thai}
                </span>
              </div>

              <div className="mt-2.5 space-y-1 text-sm">
                <div className="font-semibold text-gray-800">{r.ho_ten_tai_xe}</div>
                <div className="text-xs text-gray-500">
                  Số CCCD: <span className="font-semibold text-gray-700">{r.so_cccd || '—'}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {r.cong_ty_chu_quan}
                  {r.bo_phan ? ` · ${r.bo_phan === 'Khác' ? r.bo_phan_khac : r.bo_phan}` : ''}
                  {r.cong_ty ? ` · ${r.cong_ty}` : ''}
                </div>
                <div className="text-xs text-gray-500">{r.muc_dich_vao_kho}</div>
                <div className="flex justify-between pt-1 text-xs text-gray-400">
                  <span>Vào: {new Date(r.thoi_gian_vao).toLocaleString('vi-VN')}</span>
                </div>
                {r.thoi_gian_ra && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Ra: {new Date(r.thoi_gian_ra).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {r.nhan_vien_kiem_soat_ra && (
                  <div className="text-xs text-gray-400">NV kiểm soát xe ra: {r.nhan_vien_kiem_soat_ra}</div>
                )}
                {(r.da_kiem_tra || r.nhan_vien_kiem_soat) && (
                  <div className="text-xs text-gray-400">
                    Kiểm soát: {r.da_kiem_tra ? 'Đã kiểm tra' : 'Chưa kiểm tra'}
                    {r.nhan_vien_kiem_soat ? ` · ${r.nhan_vien_kiem_soat}` : ''}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-30"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-semibold text-gray-500">
              Trang {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-gray-200 text-gray-600 disabled:opacity-30"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
