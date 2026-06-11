import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HistoryResult.css";
import Navbar from "../../../components/Navbar";

import {
  getMasterCaseByIdentity,
  updateHistoryResponse,
} from "../../../services/api";

import {
  FiEye,
  FiEyeOff,
  FiUser,
  FiPlusCircle,
  FiInfo,
  FiAlertCircle,
  FiDownload,
} from "react-icons/fi";

import { CLINIC_INFO, stripHtml } from "./historyUtils";

import { HeroEditableField, Toast } from "./components/HistoryWidgets";

export default function HistoryResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { identity, records } = location.state || {};
  const [data, setData] = useState([]);
  const [masterCases, setMasterCases] = useState([]);
  const [showId, setShowId] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showNewAssessMenu, setShowNewAssessMenu] = useState(false);
  const reentryRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (reentryRef.current && !reentryRef.current.contains(e.target))
        setShowNewAssessMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!identity) {
      navigate("/history");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getMasterCaseByIdentity(identity);

        const fetchedResponses = res.data.responses || [];
        const mCases = res.data.masterCases || [];

        setData(fetchedResponses);
        setMasterCases(mCases);
      } catch (err) {
        if (Array.isArray(records) && records.length) setData(records);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [identity, navigate, records]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const maskedId = identity
    ? identity.slice(0, -4).replace(/\d/g, "●") + identity.slice(-4)
    : "";

  const handleHeroSave = async (field, value) => {
    if (!data.length) return;
    const targetId = data[0].id;
    try {
      const res = await updateHistoryResponse(targetId, { field, value });
      handleFieldSave(targetId, field, value, res.data?.updated_at);
    } catch (err) {
      alert(`บันทึกไม่สำเร็จ: ${err?.response?.data?.message || err?.message}`);
    }
  };

  const handleFieldSave = (responseId, field, value, updatedAt) => {
    setData((prev) =>
      prev.map((item) => {
        if (item.id !== responseId) return item;
        const sd = { ...item.summary_data };
        sd[field] = value;
        sd[`${field}_updated_at`] = updatedAt;
        return { ...item, summary_data: sd };
      }),
    );
    showToast("บันทึกสำเร็จ ✓", "success");
  };

  // --- ส่วน Loading ---
  if (loading)
    return (
      <div className="hr-loading-screen">
        <div className="hr-loading-container">
          <div className="hr-loading-spinner">
            <div className="hr-spinner-ring"></div>
          </div>
          <div className="hr-loading-content">
            <h3 className="hr-loading-text">กำลังโหลด</h3>
          </div>
        </div>
      </div>
    );

  const allNames = [
    ...new Set(
      data
        .map((d) => stripHtml(d.summary_data?.display_name))
        .filter((n) => n && n !== "-"),
    ),
  ];
  const allPhones = [
    ...new Set(
      data
        .map((d) =>
          stripHtml(
            d.summary_data?.phone ||
              d.summary_data?.raw_answers?.["เบอร์โทรศัพท์"] ||
              d.summary_data?.display_phone,
          ),
        )
        .filter((p) => p && p !== "-"),
    ),
  ];

  const latestName = allNames[0] || "-";
  const pastNames = allNames.slice(1);
  const latestPhone = allPhones[0] || "-";
  const pastPhones = allPhones.slice(1);

  const visitedClinics = [
    ...new Set(data.map((d) => d.clinicType || d.clinic_type || "general")),
  ];
  const activeCases = masterCases.filter((mc) => mc.status === "Open");

  return (
    <div className="hr-page">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <Navbar
        showBack={true}
        backText="กลับค้นหา"
        onBack={() => navigate("/history")}
      />

      <div className="hr-layout">
        {/* 🟢 ส่วนหัวแฟ้มประวัติ (Hero Profile) */}
        <div className="hr-hero">
          <div className="hr-hero-grid">
            <div className="hr-avatar">
              {latestName !== "-" ? latestName.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="hr-hero-info">
              <div className="hr-name-row" style={{ alignItems: "flex-start" }}>
                <HeroEditableField
                  value={latestName}
                  isTitle={true}
                  onSave={(newVal) => handleHeroSave("display_name", newVal)}
                />
                {pastNames.length > 0 && (
                  <div
                    className="hr-info-icon-wrapper"
                    style={{ marginTop: 6 }}
                  >
                    <FiInfo size={16} />
                    <div className="hr-tooltip">
                      <strong>เคยบันทึกชื่ออื่น:</strong>
                      <br />
                      {pastNames.join(", ")}
                    </div>
                  </div>
                )}
              </div>

              <div className="hr-profile-meta">
                <div className="hr-id-pill">
                  <FiUser size={12} color="rgba(255,255,255,0.8)" />
                  <span className="hr-id-value">
                    {showId ? identity : maskedId}
                  </span>
                  <button
                    className="hr-id-toggle"
                    onClick={() => setShowId(!showId)}
                  >
                    {showId ? <FiEyeOff size={13} /> : <FiEye size={13} />}
                  </button>
                </div>

                <div
                  className="hr-id-pill"
                  style={{ padding: "4px 10px", gap: 4 }}
                >
                  <HeroEditableField
                    value={latestPhone}
                    type="tel"
                    icon="phone"
                    onSave={(newVal) => handleHeroSave("phone", newVal)}
                  />
                  {pastPhones.length > 0 && (
                    <div
                      className="hr-info-icon-wrapper"
                      style={{ marginLeft: 4 }}
                    >
                      <FiInfo size={14} color="rgba(255,255,255,0.7)" />
                      <div className="hr-tooltip">
                        <strong>เบอร์โทรอื่นในระบบ:</strong>
                        <br />
                        {pastPhones.join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="hr-clinic-badges" style={{ marginTop: 12 }}>
                {Object.values(CLINIC_INFO)
                  .filter(
                    (c) =>
                      c.id !== "general" || visitedClinics.includes("general"),
                  )
                  .map((clinic) => {
                    const isVisited = visitedClinics.includes(clinic.id);
                    return (
                      <span
                        key={clinic.id}
                        className="hr-badge-clinic"
                        style={
                          isVisited
                            ? {
                                backgroundColor: clinic.bg,
                                color: clinic.color,
                                border: `1px solid ${clinic.border}`,
                              }
                            : {
                                backgroundColor: "rgba(255,255,255,0.1)",
                                color: "rgba(255,255,255,0.5)",
                                border: "1px dashed rgba(255,255,255,0.3)",
                              }
                        }
                      >
                        {isVisited ? "✓ " : ""}
                        {clinic.text}
                      </span>
                    );
                  })}
              </div>
            </div>

            <div className="hr-hero-actions" ref={reentryRef}>
              <div className="hr-reentry-wrapper">
                <button
                  className="hr-btn-new-assess"
                  onClick={() => setShowNewAssessMenu(!showNewAssessMenu)}
                >
                  <FiPlusCircle size={16} /> เริ่มการประเมินใหม่ ▾
                </button>
                {showNewAssessMenu && (
                  <div className="hr-reentry-menu">
                    <div className="hr-reentry-header">
                      เลือกแผนกเพื่อเข้ารับการประเมิน
                    </div>
                    {Object.values(CLINIC_INFO)
                      .filter((c) => c.id !== "general")
                      .map((c) => (
                        <button
                          key={c.id}
                          className="hr-reentry-item"
                          onClick={() =>
                            navigate("/", {
                              state: {
                                targetClinic: c.id,
                                prefillIdentity: identity,
                              },
                            })
                          }
                        >
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              backgroundColor: c.color,
                              marginRight: 10,
                            }}
                          ></div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--gray-800)",
                            }}
                          >
                            {c.text}
                          </span>
                        </button>
                      ))}
                    <button
                      className="hr-reentry-item"
                      onClick={() => navigate("/")}
                      style={{ borderTop: "1px solid var(--gray-100)" }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--gray-500)",
                          paddingLeft: 22,
                        }}
                      >
                        ดูแบบฟอร์มทั้งหมด
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* แบนเนอร์แนะนำดาวน์โหลดแอป */}
        <div className="hr-suth-promo-banner">
          {/* ฝั่งซ้าย */}
          <div className="promo-left">
            <img
              src="/sutapp/phone.png"
              alt="SUTH App Phone"
              className="promo-phone-img"
            />
            <div className="promo-text-content">
              <h2>
                กรุณาดาวน์โหลด{" "}
                <span className="highlight-orange">SUTH App</span>
              </h2>
              <p className="promo-desc">
                เพื่อรับการแจ้งเตือนการนัดหมายและติดตามข้อมูลการเข้ารับบริการได้สะดวกยิ่งขึ้น
              </p>
            </div>
          </div>

          <div className="promo-divider"></div>

          {/* ฝั่งขวา */}
          <div className="promo-right">
            <div className="promo-top-content">
              <img src="/sutapp/qr.png" alt="QR Code" className="promo-qr" />
              <div className="promo-store-logos">
                <img src="/sutapp/logo-download.png" alt="Download Buttons" />
              </div>
            </div>
            <button
              className="download-btn"
              onClick={() =>
                window.open(
                  "https://play.google.com/store/apps/details?id=th.go.suth.app",
                  "_blank",
                )
              }
            >
              <FiDownload style={{ marginRight: "8px" }} /> ดาวน์โหลดเลย
            </button>
          </div>
        </div>

        {activeCases.length > 0 && (
          <>
            <h3 className="hr-current-treatment-title">
              การรักษาปัจจุบันของแต่ละคลินิก
            </h3>

            <div className="hr-active-cases-list">
              {activeCases.map((mc) => {
                const relatedResponse = data.find(
                  (d) => d.master_case_id === mc.id,
                );

                const actualClinicType =
                  mc.clinicType ||
                  mc.clinic_type ||
                  relatedResponse?.clinicType ||
                  relatedResponse?.clinic_type ||
                  "general";

                const cInfo =
                  CLINIC_INFO[actualClinicType] || CLINIC_INFO.general;

                const currentStatus =
                  relatedResponse?.status || "รอติดต่อ (รอดำเนินการ)";

                return (
                  <div
                    key={mc.id}
                    className="hr-active-case-card"
                    onClick={() =>
                      navigate("/clinic-detail", {
                            state: {
                              identity,
                              masterCase: mc,
                              clinicType: actualClinicType,
                            },
                          })
                    }
                  >
                    {/* ซ้าย */}
                    <div className="hr-case-left">
                      <div
                        className="hr-case-icon"
                        style={{
                          backgroundColor: cInfo.bg,
                        }}
                      >
                        <FiAlertCircle size={24} color={cInfo.color} />
                      </div>

                      <div className="hr-case-info">
                        <h4>{cInfo.text}</h4>

                        <div className="hr-case-status">
                          ● สถานะ:
                          <span>{currentStatus}</span>
                        </div>

                        <div className="hr-case-code">
                          MC-{String(mc.id).padStart(4, "0")}
                        </div>
                      </div>
                    </div>

                    {/* กลาง */}
                    <div className="hr-case-center">
                      <div className="hr-case-detail-title">
                        รายละเอียดการรักษา
                      </div>

                      <div className="hr-case-detail-text">
                        อยู่ระหว่างการประเมินโดยนักจิตวิทยา
                        <br />
                        รอเจ้าหน้าที่ติดต่อกลับเพื่อนัดแผนการรักษา
                      </div>
                    </div>

                    {/* ขวา */}
                    <div className="hr-case-right">
                      <button
                        className="hr-case-btn"
                        onClick={(e) => {
                          e.stopPropagation();

                          navigate("/clinic-detail", {
                            state: {
                              identity,
                              masterCase: mc,
                              clinicType: actualClinicType,
                            },
                          });
                        }}
                      >
                        ดูรายละเอียด →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
