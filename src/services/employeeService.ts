import { supabase } from '../lib/supabase';
import type { NhanVienKiemSoat } from '../types';

const TABLE = 'nhan_vien_kiem_soat';

function friendly(error: { code?: string; message: string }, action: string): Error {
  if (error.code === '23505') return new Error('Tên nhân viên này đã tồn tại.');
  return new Error(`Không thể ${action}: ${error.message}`);
}

export const employeeService = {
  async list(): Promise<NhanVienKiemSoat[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('ho_ten', { ascending: true });
    if (error) throw friendly(error, 'tải danh mục nhân viên');
    return (data ?? []) as NhanVienKiemSoat[];
  },

  async create(hoTen: string): Promise<NhanVienKiemSoat> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert({ ho_ten: hoTen.trim() })
      .select()
      .single();
    if (error) throw friendly(error, 'thêm nhân viên');
    return data as NhanVienKiemSoat;
  },

  async update(id: string, hoTen: string): Promise<NhanVienKiemSoat> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ ho_ten: hoTen.trim() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw friendly(error, 'sửa nhân viên');
    return data as NhanVienKiemSoat;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw friendly(error, 'xóa nhân viên');
  },
};
