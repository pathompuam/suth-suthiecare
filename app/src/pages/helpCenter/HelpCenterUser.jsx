import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronRight, FiChevronDown, FiMessageCircle, FiHeadphones, FiGrid } from 'react-icons/fi';
import { getActiveClinics, getFaqsAdmin } from '../../services/api';
import './HelpCenterUser.css';
import Navbar from '../../components/Navbar';

export default function HelpCenterUser() {
    const navigate = useNavigate();
    const scrollRef = React.useRef(null);
    const [clinics, setClinics] = useState([]);
    const [commonFaqs, setCommonFaqs] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [isAllClinicsExpanded, setIsAllClinicsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const resClinic = await getActiveClinics();
            setClinics(resClinic.data?.data || []);
            const resFaq = await getFaqsAdmin({ is_homepage: 1 });
            const faqData = resFaq.data?.data || [];
            const homepageFaqs = faqData
                .filter(faq => faq.is_homepage === 1)
                .sort((a, b) => (parseInt(a.display_order) || 0) - (parseInt(b.display_order) || 0));
            setCommonFaqs(homepageFaqs);
        } catch (err) {
            console.error("Error fetching user help center data:", err);
        } finally {
            setIsLoading(false); 
        }
    };

    // ฟังก์ชันควบคุมการเลื่อนสไลด์เมื่อคลิกปุ่มลูกศร
    const handleScroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
            scrollRef.current.scrollTo({
                left: scrollLeft + scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="hc-user-page">
            {/* ── NAVBAR ── */}
            <Navbar
                showBack={true}
                backText="กลับหน้าหลัก"
            />
            {/* ── HERO SECTION ── */}
            <header className="hc-user-hero">
                <div className="hc-user-container">
                   
                    <h1>ศูนย์ช่วยเหลือ SUTHieCare</h1>
                    <p>ค้นหาคำถามที่คุณต้องการเกี่ยวกับระบบ แนะนำการใช้งาน และรายการตอบข้อคำถามต่างๆ ที่พบบ่อย</p>

                    <div className="hc-user-search-wrapper">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="ค้นหาคำถาม"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                       />
                    </div>
                </div>
            </header>

            <main className="hc-user-container">
                {isLoading ? (
                    <div className="hc-user-loading-state">
                        <div className="hc-user-loading-spinner"></div>
                        <p>กำลังโหลดข้อมูล</p>
                    </div>
                ) : (
                    <>
                {/* ── CLINIC SELECTION ── */}
                <section className="hc-user-section">
                    <div className="hc-section-header-row">
                        <div className="hc-section-header">
                            <FiGrid className="hc-header-icon" />
                            <div className="hc-section-header-text">
                                <h2>เลือกหมวดหมู่คลินิก</h2>
                                <p>เลือกคลินิกที่คุณต้องการข้อมูลช่วยเหลือ และคำถามที่เกี่ยวข้อง</p>
                            </div>
                        </div>
                        <button
                            className="hc-link-more"
                            onClick={() => setIsAllClinicsExpanded(!isAllClinicsExpanded)}
                            type="button"
                        >
                            {isAllClinicsExpanded ? (
                                <>ย่อกลับ <FiChevronDown style={{ transform: 'rotate(180deg)' }} /></>
                            ) : (
                                <>ดูทั้งหมด <FiChevronRight /></>
                            )}
                        </button>
                    </div>

                    {/* 🎯 ลอจิก Conditional Rendering สลับโครงสร้างตามสถานะการกดปุ่ม */}
                    {isAllClinicsExpanded ? (
                        /* ร่างที่ 1: เมื่อเปิดแผ่ขยายออกทั้งหมด -> แสดงเป็น Grid แถวตั้งลงมา ไม่มีปุ่มลูกศร */
                        <div className="hc-user-clinic-grid-expanded">
                            {clinics
                                .filter((clinic) => clinic.show_in_help_center === 1)
                                .map((clinic) => (
                                    <div
                                        key={clinic.id}
                                        className="hc-user-clinic-card"
                                        onClick={() => navigate(`/help-center/clinic/${clinic.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="hc-card-main-content">
                                            <div className="hc-card-visual-container">
                                                <div className="hc-card-logo-circle">
                                                    <img src={clinic.image} alt={clinic.name} />
                                                </div>
                                            </div>
                                            <div className="hc-card-text-container">
                                                <h3>{clinic.name}</h3>
                                            </div>
                                        </div>
                                        <button className="hc-btn-view-clinic" type="button">
                                            ดูคำถามทั้งหมด <FiChevronRight />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        /* ร่างที่ 2: สถานะเริ่มต้นปกติ -> เป็นสไลด์แนวนอน พร้อมลูกศรลอยควบคุม */
                        <div className="hc-slider-wrapper">
                            <button className="hc-slider-arrow arrow-left" onClick={() => handleScroll('left')} type="button">&lt;</button>

                            <div className="hc-user-clinic-grid-scroll" ref={scrollRef}>
                                {clinics
                                    .filter((clinic) => clinic.show_in_help_center === 1)
                                    .map((clinic) => (
                                        <div
                                            key={clinic.id}
                                            className="hc-user-clinic-card-scroll"
                                            onClick={() => navigate(`/help-center/clinic/${clinic.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="hc-card-main-content">
                                                <div className="hc-card-visual-container">
                                                    <div className="hc-card-logo-circle">
                                                        <img src={clinic.image} alt={clinic.name} />
                                                    </div>
                                                </div>
                                                <div className="hc-card-text-container">
                                                    <h3>{clinic.name}</h3>
                                                </div>
                                            </div>
                                            <button className="hc-btn-view-clinic" type="button">
                                                ดูคำถามทั้งหมด <FiChevronRight />
                                            </button>
                                        </div>
                                    ))}
                            </div>

                            <button className="hc-slider-arrow arrow-right" onClick={() => handleScroll('right')} type="button">&gt;</button>
                        </div>
                    )}
                </section>

                {/* ── FAQ ACCORDION ── */}
                <section className="hc-user-section">
                    <div className="hc-section-header">
                        <FiMessageCircle className="hc-header-icon" />
                        <div className="hc-section-header-text">
                            <div className="hc-header-title">
                                <h2>คำถามที่พบบ่อย (FAQ)</h2>
                            </div>
                        </div>
                    </div>

                    <div className="hc-user-faq-list">
                        {commonFaqs.map((faq, index) => (
                            <div key={faq.faq_id} className={`hc-faq-item ${openFaqIndex === index ? 'open' : ''}`}>
                                <div className="hc-faq-question" onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}>
                                    <span>{faq.question}</span>
                                    <FiChevronDown />
                                </div>
                                {openFaqIndex === index && (
                                    <div className="hc-faq-answer" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── CONTACT CTA ── */}
                <section className="hc-user-contact-box">
                    <div className="hc-contact-info">
                        <img src="/assets/support-agent.png" alt="Support" />
                        <div className="hc-contact-text">
                            <h3>ยังไม่พบคำถามที่ต้องการ?</h3>
                            <p>เราพร้อมช่วยเหลือและตอบทุกข้อสงสัยของคุณเสมอ สามารถติดต่อเจ้าหน้าที่เพื่อสอบถามเพิ่มเติมได้ทันที</p>
                        </div>
                    </div>
                    <button className="hc-btn-contact-live">
                        <FiHeadphones /> ติดต่อเจ้าหน้าที่
                    </button>
                </section>
                </>
                )}
            </main>
        </div >
    );
}