import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiArrowLeft, FiChevronDown, 
  FiGrid, FiMessageCircle, FiHeart 
} from 'react-icons/fi';
import { getFaqCategories } from '../../services/api';
import './ClinicHelpDetail.css';

export default function ClinicHelpDetail({ selectedClinic, commonFaqs, onBack }) {
    const [clinicCategories, setClinicCategories] = useState([]); 
    const [activeTab, setActiveTab] = useState('all'); 
    const [clinicSearchQuery, setClinicSearchQuery] = useState(''); 
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    // ดึงหมวดหมู่ย่อยของคลินิกที่ถูกเลือกเมื่อคอมโพเนนต์เริ่มทำงาน
    useEffect(() => {
        const fetchCategories = async () => {
            if (!selectedClinic) return;
            try {
                const resCat = await getFaqCategories(selectedClinic.id);
                const catData = resCat.data?.data || [];
                // กรองเอาเฉพาะหมวดหมู่ย่อยที่เป็นสถานะเผยแพร่ (published) เท่านั้น
                setClinicCategories(catData.filter(c => c.status === 'published'));
            } catch (err) {
                console.error("Error fetching clinic categories:", err);
                setClinicCategories([]);
            }
        };
        
        fetchCategories();
        // รีเซ็ตค่าสเตตภายในทุกครั้งที่เปลี่ยนคลินิก
        setClinicSearchQuery('');
        setActiveTab('all');
        setOpenFaqIndex(null);
    }, [selectedClinic]);

    if (!selectedClinic) return null;

    return (
        <div className="hc-clinic-detail-wrapper">
            {/* 🎨 แบนเนอร์หัวคลินิก - ดึงรูปภาพประจำคลินิกมาเป็นพื้นหลังพร้อม Overlay หน้ากากสีเข้ม */}
            <header 
                className="hc-clinic-detail-hero"
                style={{ 
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.75)), url(${selectedClinic.bg || selectedClinic.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="hc-user-container hc-clinic-hero-inner">
                    <button className="hc-clinic-back-btn" onClick={onBack}>
                        <FiArrowLeft /> กลับหน้าหลักศูนย์ช่วยเหลือ
                    </button>
                    
                    <div className="hc-clinic-badge-label">
                        <FiHeart className="mini-heart" /> {selectedClinic.name}
                    </div>
                    <h1>{selectedClinic.name}</h1>
                    <p>คำแนะนำและคำถามที่พบบ่อยเกี่ยวกับสุขภาพกายและสุขภาพใจของ{selectedClinic.name}</p>
                </div>
            </header>

            {/* แถบเมนู TABS ควบคุมการเลือกหมวดหมู่ย่อยด้านบน */}
            <div className="hc-clinic-tabs-nav-bar">
                <div className="hc-user-container hc-tabs-flex">
                    <button 
                        className={`hc-tab-nav-item ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('all'); setOpenFaqIndex(null); }}
                    >
                        คำถามทั้งหมด
                    </button>
                    {clinicCategories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`hc-tab-nav-item ${activeTab === cat.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(cat.id); setOpenFaqIndex(null); }}
                        >
                            {cat.category_name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="hc-user-container" style={{ marginTop: '30px', marginBottom: '8px' }}>
                {/* กล่องค้นหาคำถามภายในคลินิก */}
                <div className="hc-clinic-internal-search-box">
                    <FiSearch className="internal-search-icon" />
                    <input 
                        type="text" 
                        placeholder={`ค้นหาคำถามใน${selectedClinic.name}...`}
                        value={clinicSearchQuery}
                        onChange={(e) => setClinicSearchQuery(e.target.value)}
                    />
                </div>

                {/* ส่วนเลือกหมวดหมู่ย่อยแบบปุ่มการ์ดเหลี่ยมแถวกลาง */}
                {activeTab === 'all' && !clinicSearchQuery && (
                    <section className="hc-sub-category-selector-section">
                        <div className="hc-sub-cat-title">
                            <FiGrid className="icon-grid" />
                            <div>
                                <h3>เลือกหมวดหมู่คำถาม</h3>
                                <p>เลือกหมวดหมู่ที่ต้องการ เพื่อดูคำถามที่เกี่ยวข้อง</p>
                            </div>
                        </div>
                        <div className="hc-sub-cat-button-grid">
                            <button 
                                className={`hc-sub-cat-btn-card ${activeTab === 'all' ? 'selected' : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                <span className="cat-card-name" style={{ textAlign: 'center', width: '100%' }}>ทั้งหมด</span>
                            </button>
                            {clinicCategories.map((cat) => (
                                <button 
                                    key={cat.id}
                                    className={`hc-sub-cat-btn-card ${activeTab === cat.id ? 'selected' : ''}`}
                                    onClick={() => setActiveTab(cat.id)}
                                >
                                    <span className="cat-card-name" style={{ textAlign: 'center', width: '100%' }}>{cat.category_name}</span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* แผงรายการคำถามคิวย่อย (Accordion) */}
                <div className="hc-clinic-faq-render-zone" style={{ marginTop: '40px' }}>
                    {clinicCategories
                        .filter(cat => activeTab === 'all' || activeTab === cat.id)
                        .map((cat) => {
                            // กรองข้อคำถามตามความสอดคล้องของหมวดหมู่และชื่อคลินิก
                            const filteredQuestions = commonFaqs.filter(faq => 
                                faq.status === 'published' &&
                                (faq.category_name || '').trim() === (cat.category_name || '').trim() &&
                                (faq.clinic_name || '').trim() === (selectedClinic.name || '').trim() &&
                                (clinicSearchQuery === '' || faq.question.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
                            ).sort((a, b) => (parseInt(a.display_order) || 0) - (parseInt(b.display_order) || 0));

                            if (filteredQuestions.length === 0) return null;

                            return (
                                <div key={cat.id} className="hc-category-block-group" style={{ marginBottom: '35px' }}>
                                    
                                    {/* 🎯 หัวข้อกลุ่มหมวดหมู่ย่อยสีม่วง (ไม่มีไอคอนด้านหน้าตามบรีฟ) */}
                                    <div className="hc-category-block-header">
                                        <h4>{cat.category_name}</h4>
                                    </div>

                                    {/* รายการคำถามในกลุ่มนี้ */}
                                    <div className="hc-user-faq-list" style={{ marginTop: '15px' }}>
                                        {filteredQuestions.map((faq) => {
                                            const uniqueFaqId = `faq-${faq.faq_id}`;
                                            const isFaqOpen = openFaqIndex === uniqueFaqId;
                                            return (
                                                <div key={faq.faq_id} className={`hc-faq-item ${isFaqOpen ? 'open' : ''}`}>
                                                    <div className="hc-faq-question" onClick={() => setOpenFaqIndex(isFaqOpen ? null : uniqueFaqId)}>
                                                        <span>{faq.question}</span>
                                                        <FiChevronDown />
                                                    </div>
                                                    {isFaqOpen && (
                                                        <div className="hc-faq-answer" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                    {/* หน้าต่างแสดงผลเมื่อค้นหาอะไรไม่เจอเลย */}
                    {commonFaqs.filter(faq => 
                        faq.status === 'published' &&
                        (faq.clinic_name || '').trim() === (selectedClinic.name || '').trim() &&
                        (activeTab === 'all' || clinicCategories.find(c => c.id === activeTab)?.category_name === faq.category_name) &&
                        (faq.question.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
                    ).length === 0 && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                          <FiMessageCircle size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                          <p style={{ fontSize: '15px' }}>ไม่พบข้อคำถามที่คุณกำลังตามหาในขณะนี้</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}