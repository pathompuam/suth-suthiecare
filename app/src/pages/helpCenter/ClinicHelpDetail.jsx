import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { 
  FiSearch, FiChevronDown, FiMessageCircle, FiHeart 
} from 'react-icons/fi';
import { getFaqCategories, getActiveClinics, getFaqsAdmin } from '../../services/api'; 
import './ClinicHelpDetail.css';
import Navbar from '../../components/Navbar'; // 🎯 เรียกใช้ Navbar ตัวหลักเดิม

export default function ClinicHelpDetail() {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [selectedClinic, setSelectedClinic] = useState(null); 
    const [clinicCategories, setClinicCategories] = useState([]); 
    const [allFaqs, setAllFaqs] = useState([]); 
    const [activeTab, setActiveTab] = useState('all'); 
    const [clinicSearchQuery, setClinicSearchQuery] = useState(''); 
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const fetchClinicAndFaqs = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const resClinic = await getActiveClinics();
                const clinicList = resClinic.data?.data || [];
                const currentClinic = clinicList.find(c => String(c.id) === String(id));
                
                if (currentClinic) {
                    setSelectedClinic(currentClinic);
                    
                    const resCat = await getFaqCategories(currentClinic.id);
                    const catData = resCat.data?.data || [];
                    setClinicCategories(catData.filter(c => c.status === 'published'));
                }

                const resFaq = await getFaqsAdmin();
                setAllFaqs(resFaq.data?.data || []);

            } catch (err) {
                console.error("Error fetching clinic and faq details:", err);
            } finally {
                setLoading(false);
            }
        };
        
        fetchClinicAndFaqs();
        setClinicSearchQuery('');
        setActiveTab('all');
        setOpenFaqIndex(null);
    }, [id]);

    const handleBack = () => {
        navigate('/help-center');
    };

    if (loading) {
        return (
            <div className="hc-clinic-loading-container">
                <div className="hc-clinic-loading-spinner"></div>
                <p>กำลังโหลดข้อมูล</p>
            </div>
        );
    }

    if (!selectedClinic) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
                <p style={{ fontSize: '16px' }}>ไม่พบข้อมูลคลินิกที่คุณต้องการ</p>
                <button onClick={handleBack} style={{ marginTop: '15px', color: '#f47932', cursor: 'pointer', background: 'none', border: 'none', textDecoration: 'underline' }}>
                    กลับสู่ศูนย์ช่วยเหลือ
                </button>
            </div>
        );
    }

    return (
        <div className="hc-clinic-detail-wrapper">
            {/* ── 🎯 NAVBAR ตัวเดิม ── */}
            <Navbar
                showBack={true}
                backText="กลับหน้าหลัก"
            />
            
            {/* ── HERO BANNER ── */}
            <header 
                className="hc-clinic-detail-hero"
                style={{ 
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.55), rgba(15, 23, 42, 0.75)), url(${selectedClinic.bg || selectedClinic.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div className="hc-user-container hc-clinic-hero-inner">
                    <div className="hc-clinic-badge-label">
                        <FiHeart className="mini-heart" /> {selectedClinic.name}
                    </div>
                    <h1>{selectedClinic.name}</h1>
                    <p>คำแนะนำและคำถามที่พบบ่อยเกี่ยวกับสุขภาพกายและสุขภาพใจของ{selectedClinic.name}</p>
                </div>
            </header>

            {/* ── MAIN CONTENT ZONE (SPLIT LAYOUT) ── */}
            <div className="hc-user-container hc-split-layout-container">
                
                {/* 🎯 [ฝั่งซ้าย]: แท็บรายการหมวดหมู่คำถาม (Sidebar Menu - ไม่ใส่ไอคอนแล้ว) */}
                <aside className="hc-clinic-sidebar-menu">
                    <div className="hc-sidebar-title">หมวดหมู่คำถาม</div>
                    <ul className="hc-sidebar-nav-list">
                        <li 
                            className={`hc-sidebar-nav-item ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('all'); setOpenFaqIndex(null); }}
                        >
                            ทั้งหมด
                        </li>
                        {clinicCategories.map((cat) => (
                            <li
                                key={cat.id}
                                className={`hc-sidebar-nav-item ${activeTab === cat.id ? 'active' : ''}`}
                                onClick={() => { setActiveTab(cat.id); setOpenFaqIndex(null); }}
                            >
                                {cat.category_name}
                            </li>
                        ))}
                    </ul>
                </aside>

                {/* 🎯 [ฝั่งขวา]: กล่องค้นหาคำถาม และ ส่วนแสดงข้อคำถามพร้อมคำตอบด้านล่าง */}
                <div className="hc-clinic-main-content-pane">
                    
                    {/* กล่องค้นหาข้อคำถามภายใน */}
                    <div className="hc-clinic-internal-search-box">
                        <FiSearch className="internal-search-icon" />
                        <input 
                            type="text" 
                            placeholder={`ค้นหาคำถามใน${selectedClinic.name}...`}
                            value={clinicSearchQuery}
                            onChange={(e) => setClinicSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* แผงข้อคำถามและคำตอบ (Accordion Style) */}
                    <div className="hc-clinic-faq-render-zone">
                        {clinicCategories
                            .filter(cat => activeTab === 'all' || activeTab === cat.id)
                            .map((cat) => {
                                const filteredQuestions = allFaqs.filter(faq => 
                                    faq.status === 'published' &&
                                    (faq.category_name || '').trim() === (cat.category_name || '').trim() &&
                                    (faq.clinic_name || '').trim() === (selectedClinic.name || '').trim() &&
                                    (clinicSearchQuery === '' || faq.question.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
                                ).sort((a, b) => (parseInt(a.display_order) || 0) - (parseInt(b.display_order) || 0));

                                if (filteredQuestions.length === 0) return null;

                                return (
                                    <div key={cat.id} className="hc-category-block-group">
                                        {/* หัวข้อกลุ่มหมวดหมู่คำถามย่อย (ถอดไอคอนออกตามสั่ง) */}
                                        <div className="hc-category-block-header">
                                            <h4>{cat.category_name}</h4>
                                        </div>

                                        {/* รายการข้อคำถามหลักอยู่ด้านบน และสยายคำตอบลงด้านล่างเมื่อคลิก */}
                                        <div className="hc-user-faq-list">
                                            {filteredQuestions.map((faq) => {
                                                const uniqueFaqId = `faq-${faq.faq_id}`;
                                                const isFaqOpen = openFaqIndex === uniqueFaqId;
                                                return (
                                                    <div key={faq.faq_id} className={`hc-faq-item ${isFaqOpen ? 'open' : ''}`}>
                                                        {/* ส่วนข้อคำถามอยู่ด้านบน */}
                                                        <div className="hc-faq-question" onClick={() => setOpenFaqIndex(isFaqOpen ? null : uniqueFaqId)}>
                                                            <span>{faq.question}</span>
                                                            <FiChevronDown />
                                                        </div>
                                                        {/* ส่วนคำตอบอยู่ด้านล่างข้อคำถามพอดีเมื่อถูกเปิด */}
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

                        {/* หน้าจอแสดงเมื่อค้นหาข้อคำถามไม่เจอ */}
                        {allFaqs.filter(faq => 
                            faq.status === 'published' &&
                            (faq.clinic_name || '').trim() === (selectedClinic.name || '').trim() &&
                            (activeTab === 'all' || clinicCategories.find(c => c.id === activeTab)?.category_name === faq.category_name) &&
                            (faq.question.toLowerCase().includes(clinicSearchQuery.toLowerCase()))
                        ).length === 0 && (
                            <div className="hc-faq-empty-state">
                              <FiMessageCircle size={40} />
                              <p>ไม่พบข้อคำถามที่คุณกำลังตามหาในขณะนี้</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}