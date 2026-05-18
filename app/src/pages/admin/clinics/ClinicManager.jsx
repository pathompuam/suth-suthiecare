import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../../../components/Sidebar';
import { getAllClinics, createClinic, updateClinic, deleteClinic } from '../../../services/api';
import { FaPlus, FaEdit, FaTrash, FaImage, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import './ClinicManager.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ClinicManager crashed:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fee2e2', color: '#991b1b', minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
          <h2>💥 เกิดข้อผิดพลาดในหน้าจัดการคลินิก (ClinicManager)</h2>
          <p><strong>Error:</strong> {this.state.error && this.state.error.toString()}</p>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '20px', background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #fca5a5', overflowX: 'auto' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

function ClinicManagerContent() {
  const [clinics, setClinics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState(null);

  const [formData, setFormData] = useState({
    slug: '',
    name: '',
    description: '',
    image: '',
    bg: '',
    is_active: 1,
    show_icon: 1
  });

  const logoInputRef = useRef(null);
  const bgInputRef = useRef(null);

  const fetchClinics = async () => {
    setIsLoading(true);
    try {
      const res = await getAllClinics();
      setClinics(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching clinics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleOpenModal = (clinic = null) => {
    if (clinic) {
      setEditingClinic(clinic);
      setFormData({
        slug: clinic.slug || '',
        name: clinic.name || '',
        description: clinic.description || '',
        image: clinic.image || '',
        bg: clinic.bg || '',
        is_active: clinic.is_active !== undefined ? clinic.is_active : 1,
        show_icon: clinic.show_icon !== undefined ? clinic.show_icon : 1
      });
    } else {
      setEditingClinic(null);
      setFormData({
        slug: '',
        name: '',
        description: '',
        image: '',
        bg: '',
        is_active: 1,
        show_icon: 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClinic(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  const compressImage = (file, maxWidth = 1024, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
    });
  };

  const handleFileChange = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    MySwal.fire({
      title: 'กำลังเตรียมรูปภาพ...',
      allowOutsideClick: false,
      didOpen: () => { MySwal.showLoading(); }
    });

    try {
      // ย่อขนาดภาพเพื่อป้องกัน Payload ใหญ่เกินไปและเกิด Network Error
      // พื้นหลังให้กว้างสุด 1920px (คุณภาพ 80%), โลโก้ให้กว้างสุด 500px (คุณภาพ 90%)
      const maxWidth = field === 'bg' ? 1920 : 500;
      const quality = field === 'bg' ? 0.8 : 0.9;
      
      const compressedBase64 = await compressImage(file, maxWidth, quality);
      setFormData(prev => ({ ...prev, [field]: compressedBase64 }));
      MySwal.close();
    } catch (err) {
      console.error(err);
      MySwal.fire('ข้อผิดพลาด', 'ไม่สามารถประมวลผลรูปภาพได้', 'error');
    }

    if (e.target) e.target.value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.slug || !formData.name) {
       MySwal.fire({
         icon: 'error',
         title: 'ข้อผิดพลาด',
         text: 'กรุณากรอกรหัสอ้างอิงและชื่อคลินิก'
       });
       return;
    }
    
    setIsSaving(true);
    try {
      if (editingClinic) {
        await updateClinic(editingClinic.id, formData);
        
        // 🟢 Optimistic Update
        setClinics(prev => prev.map(c => c.id === editingClinic.id ? { ...c, ...formData } : c));
        
        MySwal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'อัปเดตข้อมูลคลินิกเรียบร้อย',
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        const res = await createClinic(formData);
        
        // 🟢 Optimistic Update
        setClinics(prev => [...prev, { ...formData, id: res.data?.id || Date.now() }]);
        
        MySwal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: 'เพิ่มคลินิกเรียบร้อย',
          timer: 1500,
          showConfirmButton: false
        });
      }
      handleCloseModal();
      fetchClinics(); // โหลดข้อมูลเบื้องหลังอีกรอบเพื่อความชัวร์
    } catch (err) {
      console.error('Error saving clinic:', err);
      MySwal.fire({
        icon: 'error',
        title: 'ข้อผิดพลาด',
        text: err?.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const result = await MySwal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบคลินิก "${name}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      MySwal.fire({
        title: 'กำลังลบข้อมูล...',
        allowOutsideClick: false,
        didOpen: () => { MySwal.showLoading(); }
      });
      try {
        await deleteClinic(id);
        
        // 🟢 Optimistic Update
        setClinics(prev => prev.filter(c => c.id !== id));
        
        MySwal.fire({
          icon: 'success',
          title: 'ลบสำเร็จ',
          text: 'คลินิกถูกลบเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false
        });
        fetchClinics(); // โหลดข้อมูลเบื้องหลังอีกรอบ
      } catch (err) {
        console.error('Error deleting clinic:', err);
        MySwal.fire({
          icon: 'error',
          title: 'ข้อผิดพลาด',
          text: 'ไม่สามารถลบคลินิกได้'
        });
      }
    }
  };

  return (
    <div className="cm-admin-page">
      <Sidebar activeKey="clinics" />
      <main className="cm-main">
        <header className="cm-header">
          <h1>จัดการคลินิก</h1>
          <button className="cm-btn-add" onClick={() => handleOpenModal()}>
            <FaPlus /> เพิ่มคลินิกใหม่
          </button>
        </header>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="cm-table-container">
            <table className="cm-table">
              <thead>
                <tr>
                  <th>โลโก้</th>
                  <th>รหัสอ้างอิง (Slug)</th>
                  <th>ชื่อคลินิก</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {clinics && clinics.length > 0 ? clinics.map(clinic => (
                  <tr key={clinic.id}>
                    <td>
                      {clinic.image ? (
                        <img src={clinic.image} alt={clinic.name} className="cm-clinic-logo" />
                      ) : (
                        <div className="cm-no-logo">ไม่มีรูป</div>
                      )}
                    </td>
                    <td><span className="cm-slug">{clinic.slug}</span></td>
                    <td className="cm-name">{clinic.name}</td>
                    <td>
                      {clinic.is_active ? (
                         <span className="cm-status active"><FaCheckCircle/> เปิดใช้งาน</span>
                      ) : (
                         <span className="cm-status inactive"><FaTimesCircle/> ปิดใช้งาน</span>
                      )}
                    </td>
                    <td className="cm-actions">
                      <button className="cm-btn-edit" onClick={() => handleOpenModal(clinic)} title="แก้ไข">
                        <FaEdit />
                      </button>
                      <button className="cm-btn-delete" onClick={() => handleDelete(clinic.id, clinic.name)} title="ลบ">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                )) : (
                   <tr>
                     <td colSpan="5" className="cm-empty">ไม่พบข้อมูลคลินิก</td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {isModalOpen && (
          <div className="cm-modal-overlay">
            <div className="cm-modal-content">
              <h2>{editingClinic ? 'แก้ไขคลินิก' : 'เพิ่มคลินิกใหม่'}</h2>
              <form onSubmit={handleSubmit}>
                
                <div className="cm-form-group">
                  <label>รหัสอ้างอิง (Slug) <span className="cm-required">*</span></label>
                  <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="เช่น teenager, general" required disabled={!!editingClinic} />
                  <small>ใช้เชื่อมโยงกับฟอร์มและระบบ (ห้ามซ้ำและแก้ไขไม่ได้หลังจากสร้าง)</small>
                </div>

                <div className="cm-form-group">
                  <label>ชื่อคลินิก <span className="cm-required">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="เช่น คลินิกวัยรุ่น" required />
                </div>

                <div className="cm-form-group">
                  <label>รายละเอียด</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="รายละเอียดคลินิก..." rows="3"></textarea>
                </div>

                <div className="cm-form-row">
                  <div className="cm-form-group">
                    <label>รูปภาพโลโก้ (ไอคอน)</label>
                    <div className="cm-img-preview-box" onClick={() => logoInputRef.current && logoInputRef.current.click()}>
                      {formData.image ? <img src={formData.image} alt="Logo preview" /> : <><FaImage size={24}/> <span>อัปโหลดโลโก้</span></>}
                    </div>
                    <input type="file" ref={logoInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
                  </div>

                  <div className="cm-form-group">
                    <label>รูปภาพพื้นหลัง (หน้าเว็บ)</label>
                    <div className="cm-img-preview-box cm-bg-premium" onClick={() => bgInputRef.current && bgInputRef.current.click()}>
                       {formData.bg ? <img src={formData.bg} alt="BG preview" /> : <><FaImage size={24}/> <span>อัปโหลดพื้นหลัง</span></>}
                    </div>
                    <input type="file" ref={bgInputRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleFileChange(e, 'bg')} />
                  </div>
                </div>

                <div className="cm-form-group cm-toggle-group">
                  <label className="cm-toggle">
                    <input type="checkbox" name="show_icon" checked={formData.show_icon === 1} onChange={handleChange} />
                    <span className="cm-slider"></span>
                  </label>
                  <span>แสดงไอคอนบนการ์ด</span>
                </div>

                <div className="cm-form-group cm-toggle-group">
                  <label className="cm-toggle">
                    <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} />
                    <span className="cm-slider"></span>
                  </label>
                  <span>เปิดใช้งานคลินิกนี้</span>
                </div>

                <div className="cm-modal-actions">
                  <button type="button" className="cm-btn-cancel" onClick={handleCloseModal} disabled={isSaving}>ยกเลิก</button>
                  <button type="submit" className="cm-btn-save" disabled={isSaving}>
                    {isSaving ? (editingClinic ? 'กำลังแก้ไข...' : 'กำลังเพิ่ม...') : 'บันทึกข้อมูล'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const ClinicManager = () => (
  <ErrorBoundary>
    <ClinicManagerContent />
  </ErrorBoundary>
);

export default ClinicManager;