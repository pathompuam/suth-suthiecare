import React, { useState, useEffect } from 'react';
import {
  getAllClinics,
  getFaqCategories,
  createFaqCategory,
  updateFaqCategory, 
  deleteFaqCategory, 
  getFaqsAdmin,
  createFaq,
  updateFaq,
  deleteFaq
} from '../../services/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFolderPlus, FaCheckCircle, FaTimesCircle, FaSave, FaTimes } from 'react-icons/fa';
import './HelpCenterManager.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const MySwal = withReactContent(Swal);

const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],             // 2. ตัวหนา, เอียง, ขีดเส้นใต้, ขีดฆ่า
    [{ 'color': [] }, { 'background': [] }],               // 3. เปลี่ยนสีอักษร และ สีไฮไลต์พื้นหลัง
    [{ 'script': 'sub'}, { 'script': 'super' }],           // 4. ตัวห้อย, ตัวยก
    [{ 'header': [1, 2, 3, false] }],                      // 5. ระดับหัวข้อ (Heading)
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],          // 6. เรียงข้อ 1,2,3 และ จุด Bullet (เอาปุ่มร่นย่อหน้าเข้า-ออก ด้านหลังออก)
    [{ 'align': [] }],                                     // 7. จัดซ้าย, ตรงกลาง, ขวา, ชิดขอบ
    ['link', 'image']                                      // 8. แทรกลิงก์ และ แทรกรูปภาพ (เอาปุ่มแทรกวิดีโอ และปุ่มล้างสไตล์ Tx ออก)
  ],
};

export default function HelpCenterManager() {
  const [faqs, setFaqs] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // States สำหรับแถบตัวกรอง (Filters) หน้าแรก 
  const [filterClinic, setFilterClinic] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // States สำหรับควบคุมการเปิด/ปิด Modal popup
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);

  // States สำหรับการจัดการหมวดหมู่ย่อยภายใน Modal
  const [catSelectedClinic, setCatSelectedClinic] = useState(''); // คลินิกที่เลือกดูหมวดหมู่
  const [catNameInput, setCatNameInput] = useState(''); // ช่องกรอกชื่อหมวดหมู่ (ทั้งเพิ่มและแก้ไข)
  const [editingCatId, setEditingCatId] = useState(null); // ไอดีหมวดหมู่ที่กำลังกดแก้ไข inline

  // States สำหรับฟอร์มกรอกข้อมูลคำถาม
  const [faqForm, setFaqForm] = useState({
    clinic_id: '', category_id: '', question: '', answer: '', is_homepage: 0, status: 'published', display_order: 0
  });

  // โหลดรายชื่อคลินิกทั้งหมด และข้อคำถามทั้งหมดตอนเปิดหน้าจอ
  useEffect(() => {
    fetchInitialData();
  }, []);

  // ดึงข้อมูลคำถามใหม่ทุกครั้งที่แอดมินกดเปลี่ยนตัวกรองคลินิก หรือตัวกรองสถานะหน้าแรก
  useEffect(() => {
    fetchFaqs();
  }, [filterClinic, filterStatus, searchQuery]);

  // ดึงหมวดหมู่ย่อยมาใส่ใน Dropdown ฟอร์มคำถาม ทันทีที่แอดมินเลือกคลินิกใน Modal คำถาม
  useEffect(() => {
    if (faqForm.clinic_id) {
      fetchCategoriesForForm(faqForm.clinic_id);
    } else {
      setCategories([]);
    }
  }, [faqForm.clinic_id]);

  // ดึงหมวดหมู่ย่อยมาแสดงในตารางเมื่อเปลี่ยนคลินิกใน Modal หมวดหมู่
  useEffect(() => {
    if (catSelectedClinic) {
      fetchCategoriesForForm(catSelectedClinic);
    } else {
      setCategories([]);
    }
    setCatNameInput('');
    setEditingCatId(null);
  }, [catSelectedClinic]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const resClinic = await getAllClinics();
      setClinics(resClinic.data?.data || []);
      await fetchFaqs();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFaqs = async () => {
    try {
      const res = await getFaqsAdmin({ clinic_id: filterClinic, status: filterStatus, search: searchQuery });
      setFaqs(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategoriesForForm = async (clinicId) => {
    try {
      const res = await getFaqCategories(clinicId);
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const formatThaiDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ── 🌟 ระบบจัดการหมวดหมู่ย่อยโฉมใหม่ (CRUD Categories) ──
  const handleOpenCatModal = () => {
    setCatSelectedClinic('');
    setCatNameInput('');
    setEditingCatId(null);
    setCategories([]);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catSelectedClinic || !catNameInput.trim()) return;

    try {
      if (editingCatId) {
        // โหมดแก้ไขหมวดหมู่เดิม
        await updateFaqCategory(editingCatId, { category_name: catNameInput, clinic_id: catSelectedClinic });
        MySwal.fire({ icon: 'success', title: 'สำเร็จ', text: 'อัปเดตชื่อหมวดหมู่เรียบร้อย', timer: 1200, showConfirmButton: false });
        setEditingCatId(null);
      } else {
        // โหมดเพิ่มหมวดหมู่ใหม่
        await createFaqCategory({ clinic_id: catSelectedClinic, category_name: catNameInput, display_order: 0 });
        MySwal.fire({ icon: 'success', title: 'สำเร็จ', text: 'เพิ่มหมวดหมู่ย่อยเรียบร้อย', timer: 1200, showConfirmButton: false });
      }
      setCatNameInput('');
      fetchCategoriesForForm(catSelectedClinic);
    } catch (err) {
      MySwal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลหมวดหมู่ได้', 'error');
    }
  };

  const handleStartEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setCatNameInput(cat.category_name);
  };

  const handleCancelEditCategory = () => {
    setEditingCatId(null);
    setCatNameInput('');
  };

  const handleDeleteCategory = async (id, name) => {
    const result = await MySwal.fire({
      title: 'ยืนยันการลบหมวดหมู่ย่อย?',
      text: `คุณต้องการลบหมวดหมู่ "${name}" ใช่หรือไม่? (คำถามที่ผูกกับหมวดหมู่นี้อาจได้รับผลกระทบ)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteFaqCategory(id);
        MySwal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1200, showConfirmButton: false });
        fetchCategoriesForForm(catSelectedClinic);
        fetchFaqs(); // รีเฟรชตารางใหญ่ด้านหลังเผื่อมีคำถามโดนลบตามสถานะสัมพันธ์
      } catch (err) {
        MySwal.fire('ข้อผิดพลาด', 'ไม่สามารถลบหมวดหมู่ย่อยนี้ได้เนื่องจากมีคำถามใช้งานอยู่', 'error');
      }
    }
  };


  // ── จัดการข้อคำถาม (FAQs เหมือนเดิม) ──
  const handleOpenFaqModal = (faq = null) => {
    setEditingFaq(faq);
    if (faq) {
      setFaqForm({
        clinic_id: faq.clinic_id || '',      
        category_id: faq.category_id || '',  
        question: faq.question || '',        
        answer: faq.answer || '',            
        is_homepage: faq.is_homepage === 1 ? 1 : 0,
        status: faq.status || 'published',
        display_order: faq.display_order || 0
      });
      if (faq.clinic_id) {
        fetchCategoriesForForm(faq.clinic_id);
      }
    } else {
      setFaqForm({
        clinic_id: '',
        category_id: '',
        question: '',
        answer: '', 
        is_homepage: 0,
        status: 'published',
        display_order: 0
      });
    }
    
    setIsFaqModalOpen(true);
  };

const handleSaveFaq = async (e) => {
    e.preventDefault();
    const selectedCategoryId = parseInt(faqForm.category_id);

    if (!selectedCategoryId || !faqForm.question.trim() || !faqForm.answer.trim()) {
      MySwal.fire('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบถ้วน และเลือกหมวดหมู่ย่อยให้ถูกต้อง', 'warning');
      return;
    }

    try {
      const payload = {
        ...faqForm,
        category_id: selectedCategoryId,
        is_homepage: faqForm.is_homepage === 1 ? 1 : 0,
        display_order: parseInt(faqForm.display_order) || 0
      };

    if (editingFaq) {
        await updateFaq(editingFaq.faq_id, payload);
        await MySwal.fire({ 
          icon: 'success', 
          title: 'อัปเดตคำถามเรียบร้อย', 
          timer: 1200, 
          showConfirmButton: false 
        });
      } else {
        await createFaq(payload); 
        await MySwal.fire({ 
          icon: 'success', 
          title: 'เพิ่มคำถามใหม่เรียบร้อย', 
          timer: 1200, 
          showConfirmButton: false 
        });
      }
    
      setIsFaqModalOpen(false);
      fetchFaqs();
    } catch (err) {
      console.error(err);
      MySwal.fire('ข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลคำถามได้ (Server Error 500)', 'error');
    }
  };

  const handleDeleteFaq = async (id, title) => {
    const result = await MySwal.fire({
      title: 'ยืนยันการลบคำถาม?', text: `คุณต้องการลบคำถาม "${title}" ใช่หรือไม่?`,
      icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก'
    });
    if (result.isConfirmed) {
      try {
        await deleteFaq(id);
        MySwal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false });
        fetchFaqs();
      } catch (err) {
        MySwal.fire('ข้อผิดพลาด', 'ไม่สามารถลบข้อมูลได้', 'error');
      }
    }
  };

  return (
    <div className="hc-admin-page">
      <main className="hc-main">
        <header className="hc-header">
          <div className="hc-header-info">
            <h1>จัดการศูนย์ช่วยเหลือ (FAQ)</h1>
            <p className="hc-header-hint">ตั้งค่าหมวดหมู่ย่อยและข้อคำถามที่พบบ่อยแยกตามแต่ละคลินิกบริการ</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="hc-btn-add" style={{ backgroundColor: '#ffffff', color: '#F47932', border: '1.5px solid #F47932', boxShadow: 'none' }} onClick={handleOpenCatModal}>
              <FaFolderPlus /> จัดการหมวดหมู่ย่อย
            </button>
            <button className="hc-btn-add" onClick={() => handleOpenFaqModal()}>
              <FaPlus /> เพิ่มคำถามใหม่
            </button>
          </div>
        </header>

        {/* แถบตัวกรองการค้นหาข้อมูล (Filters) */}
        <div className="hc-filter-panel">
          <div className="hc-form-group" style={{ margin: 0, flex: 1.2 }}>
            <label style={{ fontSize: '13px', color: '#64748b' }}>กรองตามคลินิก</label>
            <select value={filterClinic} onChange={(e) => setFilterClinic(e.target.value)}>
              <option value="">เลือกคลินิกทั้งหมด</option>
              {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="hc-form-group" style={{ margin: 0, flex: 3.5 }}>
            <label style={{ fontSize: '13px', color: '#64748b' }}>ค้นหาข้อคำถาม</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="พิมพ์เพื่อค้นหาข้อคำถามได้ทันที..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '35px', width: '100%', boxSizing: 'border-box' }}
              />
              <FaSearch style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="hc-form-group" style={{ margin: 0, flex: 1.2 }}>
            <label style={{ fontSize: '13px', color: '#64748b' }}>สถานะ</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">สถานะทั้งหมด</option>
              <option value="published">เผยแพร่</option>
              <option value="draft">ร่าง</option>
              <option value="hidden">ซ่อน</option>
            </select>
          </div>
        </div>

        {/* ตารางแสดงรายการข้อมูลคำถาม FAQ */}
        {isLoading ? (
          <div className="cm-loading-state"><div className="cm-loading-spinner"></div><p>กำลังโหลดข้อมูล</p></div>
        ) : (
          <div className="hc-table-container">
            <table className="hc-table">
              <thead>
                <tr>
                  <th className="hc-col-question" style={{ width: '25%' }}>คำถาม</th>
                  <th className="hc-col-clinic" style={{ width: '15%' }}>คลินิกหลัก</th>
                  <th className="hc-col-category" style={{ width: '15%' }}>หมวดหมู่ย่อย</th>
                  <th className="hc-col-homepage" style={{ width: '12%', textAlign: 'center' }}>แสดงหน้าแรก</th>
                  <th style={{ width: '13%', textAlign: 'center' }}>สถานะ</th>
                  <th style={{ width: '12%' }}>อัปเดตล่าสุด</th>
                  <th className="hc-col-actions" style={{ width: '8%' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {faqs.length > 0 ? faqs.map((faq) => (
                  <tr key={faq.faq_id}>
                    <td className="hc-col-question">{faq.question}</td>
                    <td className="hc-col-clinic">{faq.clinic_name}</td>
                    <td className="hc-col-category">
                      <span className="hc-badge-category">{faq.category_name}</span>
                    </td>
                    <td className="hc-col-homepage">
                      {faq.is_homepage === 1
                        ? <span className="hc-status-badge active">หน้าแรก</span>
                        : <span className="hc-status-badge inactive">ทั่วไป</span>
                      }
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      {faq.status === 'published' && (
                        <span className="cm-status active" style={{ fontSize: '12px', padding: '4px 10px' }}>
                          <FaCheckCircle /> เผยแพร่
                        </span>
                      )}
                      {faq.status === 'draft' && (
                        <span className="cm-status inactive" style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#f1f5f9', color: '#64748b' }}>
                          <FaTimesCircle /> ร่าง
                        </span>
                      )}
                      {faq.status === 'hidden' && (
                        <span className="cm-status inactive" style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#fee2e2', color: '#ef4444' }}>
                          <FaTimesCircle /> ซ่อน
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatThaiDate(faq.updated_at || faq.created_at)}
                    </td>

                    <td className="hc-col-actions">
                      <div className="hc-actions-wrapper">
                        <button className="hc-btn-action-edit" onClick={() => handleOpenFaqModal(faq)}><FaEdit /></button>
                        <button className="hc-btn-action-delete" onClick={() => handleDeleteFaq(faq.faq_id, faq.question)}><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="hc-empty-state">ไม่พบข้อมูลคำถามในศูนย์ช่วยเหลือ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 🌟 MODAL 1 (โฉมใหม่): หน้าต่างจัดการหมวดหมู่คำถามย่อย (Full CRUD) ── */}
        {isCatModalOpen && (
          <div className="hc-modal-overlay">
            <div className="hc-modal-content" style={{ maxWidth: '700px' }}>
              <button className="cm-close-btn-custom" onClick={() => setIsCatModalOpen(false)}><span className="cm-close-cross"></span></button>
              <h2>จัดการหมวดหมู่คำถามย่อย</h2>

              {/* ส่วนที่ 1: เลือกคลินิกหลัก */}
              <div className="hc-form-group">
                <label>เลือกคลินิกที่ต้องการจัดการ <span className="hc-required">*</span></label>
                <select
                  required
                  value={catSelectedClinic}
                  onChange={e => setCatSelectedClinic(e.target.value)}
                  disabled={!!editingCatId}
                  style={{ backgroundColor: editingCatId ? '#f1f5f9' : '#ffffff', cursor: editingCatId ? 'not-allowed' : 'pointer' }}
                >
                  <option value="">-- เลือกคลินิกเพื่อดูข้อมูล --</option>
                  {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {editingCatId && (
                  <small style={{ color: '#F47932', marginTop: '4px', fontWeight: '500' }}>
                    * กรุณาบันทึกหรือยกเลิกการแก้ไขหมวดหมู่ย่อยก่อน จึงจะสามารถเปลี่ยนคลินิกได้
                  </small>
                )}
              </div>

              {catSelectedClinic && (
                <>
                  <hr style={{ margin: '20px 0', border: '0.5px solid #e2e8f0' }} />

                  {/* ส่วนที่ 2: ฟอร์มเพิ่ม/แก้ไขหมวดหมู่ (ยืดหยุ่นในหน้าเดียว) */}
                  <form onSubmit={handleSaveCategory} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px' }}>
                    <div className="hc-form-group" style={{ margin: 0, flex: 1 }}>
                      <label>{editingCatId ? 'กำลังแก้ไขชื่อหมวดหมู่' : 'ชื่อหมวดหมู่ย่อยใหม่'} <span className="hc-required">*</span></label>
                      <input
                        type="text"
                        placeholder="เช่น การนัดหมาย, ขั้นตอนบริการ"
                        required
                        value={catNameInput}
                        onChange={e => setCatNameInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="hc-btn-save" style={{ height: '45px', padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {editingCatId ? <><FaSave /> บันทึก</> : <><FaPlus /> เพิ่มหมวดหมู่</>}
                    </button>
                    {editingCatId && (
                      <button type="button" className="hc-btn-cancel" onClick={handleCancelEditCategory} style={{ height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px' }}>
                        <FaTimes />
                      </button>
                    )}
                  </form>

                  {/* ส่วนที่ 3: ตารางรายการแสดงหมวดหมู่ย่อยที่มีอยู่ เพื่อทำการ แก้ไข หรือ ลบ */}
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '10px', color: '#334155', fontSize: '14.5px' }}>รายการหมวดหมู่ทั้งหมดในคลินิกนี้</label>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table className="hc-table" style={{ minWidth: '100%', boxShadow: 'none' }}>
                      <thead>
                        <tr>
                          <th style={{ padding: '10px 15px', fontSize: '13px' }}>ชื่อหมวดหมู่</th>
                          <th style={{ padding: '10px 15px', fontSize: '13px', width: '100px', textAlign: 'center' }}>จัดการ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.length > 0 ? categories.map(cat => (
                          <tr key={cat.id}>
                            <td style={{ padding: '10px 15px', fontSize: '14px', fontWeight: editingCatId === cat.id ? '700' : 'normal', color: editingCatId === cat.id ? '#F47932' : '#475569' }}>
                              {cat.category_name} {editingCatId === cat.id && ' (กำลังแก้ไข)'}
                            </td>
                            <td style={{ padding: '5px 15px', textAlign: 'center' }}>
                              <div className="hc-actions-wrapper" style={{ gap: '4px' }}>
                                <button type="button" className="hc-btn-action-edit" style={{ height: '30px', borderRadius: '6px' }} onClick={() => handleStartEditCategory(cat)} title="แก้ไขชื่อหมวดหมู่"><FaEdit size={12} /></button>
                                <button type="button" className="hc-btn-action-delete" style={{ height: '30px', borderRadius: '6px' }} onClick={() => handleDeleteCategory(cat.id, cat.category_name)} title="ลบหมวดหมู่"><FaTrash size={12} /></button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>ยังไม่มีหมวดหมู่ย่อยในคลินิกนี้</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── MODAL 2: เพิ่ม/แก้ไข ข้อคำถาม (เหมือนเดิม) ── */}
        {isFaqModalOpen && (
          <div className="hc-modal-overlay">
            <div className="hc-modal-content">
              <button className="cm-close-btn-custom" onClick={() => setIsFaqModalOpen(false)}><span className="cm-close-cross"></span></button>
              <h2>{editingFaq ? 'แก้ไขข้อมูลคำถาม' : 'เพิ่มข้อคำถามใหม่'}</h2>
              <form onSubmit={handleSaveFaq}>
                <div className="hc-form-row">
                  <div className="hc-form-group">
                    <label>เลือกคลินิกหลัก <span className="hc-required">*</span></label>
                    <select required value={faqForm.clinic_id} onChange={e => setFaqForm({ ...faqForm, clinic_id: e.target.value, category_id: '' })}>
                      <option value="">-- เลือกคลินิก --</option>
                      {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="hc-form-group">
                    <label>เลือกหมวดหมู่ย่อย <span className="hc-required">*</span></label>
                    <select required value={faqForm.category_id} onChange={e => setFaqForm({ ...faqForm, category_id: e.target.value })} disabled={!faqForm.clinic_id}>
                      <option value="">-- เลือกหมวดหมู่ย่อย --</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.category_name}</option>)}
                    </select>
                    {!faqForm.clinic_id && <small style={{ color: '#ef4444' }}>* กรุณาเลือกคลินิกหลักก่อนเพื่อโหลดหมวดหมู่ย่อย</small>}
                  </div>
                </div>
                <div className="hc-form-row">
                  <div className="hc-form-group">
                    <label>สถานะการเผยแพร่ <span className="hc-required">*</span></label>
                    <select required value={faqForm.status} onChange={e => setFaqForm({ ...faqForm, status: e.target.value })}>
                      <option value="published">เผยแพร่</option>
                      <option value="draft">ร่าง</option>
                      <option value="hidden">ซ่อน</option>
                    </select>
                  </div>
                  <div className="hc-form-group">
                    <label>ลำดับการแสดงผล</label>
                    <input type="number" min="0" value={faqForm.display_order} onChange={e => setFaqForm({ ...faqForm, display_order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="hc-form-group">
                  <label>ข้อคำถาม (Question) <span className="hc-required">*</span></label>
                  <input type="text" placeholder="เช่น ต้องเตรียมบัตรอะไรมาบ้างในวันนัดครั้งแรก?" required value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} />
                </div>
                <div className="hc-form-group">
                  <label>คำตอบ (Answer) <span className="hc-required">*</span></label>
                  <div style={{ background: '#ffffff', borderRadius: '6.5px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                    <ReactQuill
                      theme="snow"
                      modules={quillModules}
                      placeholder="พิมพ์เนื้อหาคำตอบ"
                      value={faqForm.answer}
                      onChange={(content) => setFaqForm({ ...faqForm, answer: content })} 
                    />
                  </div>
                </div>
                <div className="hc-form-group hc-toggle-container">
                  <label className="hc-switch">
                    <input type="checkbox" checked={faqForm.is_homepage === 1} onChange={e => setFaqForm({ ...faqForm, is_homepage: e.target.checked ? 1 : 0 })} />
                    <span className="hc-slider"></span>
                  </label>
                  <span>แสดงในคำถามที่พบบ่อยหน้าแรก</span>
                </div>
                <div className="hc-modal-actions">
                  <button type="button" className="hc-btn-cancel" onClick={() => setIsFaqModalOpen(false)}>ยกเลิก</button>
                  <button type="submit" className="hc-btn-save">บันทึกข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}