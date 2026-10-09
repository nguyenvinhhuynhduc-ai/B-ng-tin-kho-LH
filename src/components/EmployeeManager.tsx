import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { employeeService } from '../services/employeeService';
import type { NhanVienKiemSoat } from '../types';
import { Button } from './ui/Button';
import { TextField } from './ui/FormField';
import { useToast } from './ui/Toast';

interface Props {
  employees: NhanVienKiemSoat[];
  onChanged: () => Promise<void> | void;
  onClose: () => void;
}

/** Bottom-sheet quản lý danh mục nhân viên kiểm soát: thêm / sửa / xóa. */
export function EmployeeManager({ employees, onChanged, onClose }: Props) {
  const { showError, showSuccess } = useToast();
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>, okMessage: string) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      await onChanged();
      showSuccess(okMessage);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Thao tác thất bại.');
    } finally {
      setBusy(false);
    }
  }

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    run(async () => {
      await employeeService.create(name);
      setNewName('');
    }, 'Đã thêm nhân viên');
  };

  const handleSaveEdit = () => {
    const name = editName.trim();
    if (!editingId || !name) return;
    run(async () => {
      await employeeService.update(editingId, name);
      setEditingId(null);
    }, 'Đã cập nhật nhân viên');
  };

  const handleDelete = (emp: NhanVienKiemSoat) => {
    if (!window.confirm(`Xóa nhân viên "${emp.ho_ten}"?\nCác bản ghi cũ vẫn giữ nguyên tên đã chọn.`)) return;
    run(() => employeeService.remove(emp.id), 'Đã xóa nhân viên');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-4">
          <h2 className="text-base font-extrabold text-gray-900">Quản lý nhân viên kiểm soát</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 active:bg-gray-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex items-end gap-2 px-5 pb-3">
          <div className="flex-1">
            <TextField
              label="Thêm nhân viên mới"
              placeholder="Họ và tên"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <Button
            fullWidth={false}
            className="!w-14 !px-0"
            icon={<Plus size={22} />}
            onClick={handleAdd}
            disabled={!newName.trim() || busy}
            aria-label="Thêm"
          >
            <></>
          </Button>
        </div>

        <ul className="flex-1 space-y-2 overflow-y-auto px-5 pb-5">
          {employees.length === 0 && (
            <li className="py-6 text-center text-sm text-gray-400">Chưa có nhân viên nào.</li>
          )}
          {employees.map((emp) => (
            <li key={emp.id} className="flex items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-2">
              {editingId === emp.id ? (
                <>
                  <input
                    autoFocus
                    className="h-12 min-w-0 flex-1 rounded-xl border-2 border-green-600 bg-white px-3 text-base outline-none"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                  />
                  <IconBtn label="Lưu" onClick={handleSaveEdit} disabled={!editName.trim() || busy}>
                    <Check size={20} />
                  </IconBtn>
                  <IconBtn label="Hủy" onClick={() => setEditingId(null)}>
                    <X size={20} />
                  </IconBtn>
                </>
              ) : (
                <>
                  <span className="min-w-0 flex-1 truncate px-2 text-base font-semibold text-gray-800">
                    {emp.ho_ten}
                  </span>
                  <IconBtn
                    label="Sửa"
                    onClick={() => {
                      setEditingId(emp.id);
                      setEditName(emp.ho_ten);
                    }}
                  >
                    <Pencil size={18} />
                  </IconBtn>
                  <IconBtn label="Xóa" onClick={() => handleDelete(emp)} danger disabled={busy}>
                    <Trash2 size={18} />
                  </IconBtn>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 bg-white disabled:opacity-40',
        danger ? 'border-red-100 text-red-500 active:bg-red-50' : 'border-gray-200 text-gray-600 active:bg-gray-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
