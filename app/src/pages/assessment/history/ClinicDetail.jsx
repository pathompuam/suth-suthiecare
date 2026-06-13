import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ClinicDetail.css";

export default function ClinicDetail() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    clinicType,
    masterCase,
    bmiRecords = [],
    adviceByClinic = {},
    timelineEvents = [],
  } = location.state || {};

  const advice = adviceByClinic?.[clinicType];

  return (
    <div className="clinic-detail-page">

      <button
        className="clinic-back-btn"
        onClick={() => navigate(-1)}
      >
        ← ย้อนกลับ
      </button>

      <div className="clinic-hero">

        <div className="clinic-hero-content">
          <h1>
            {clinicType || "คลินิกปรับเปลี่ยนพฤติกรรม"}
          </h1>

          <p>
            ดูแล เข้าใจ ปรับเปลี่ยน เพื่อวัยรุ่นที่แข็งแรงทั้งใจ
          </p>
        </div>


      </div>

      <div className="clinic-top-section">

        <div className="bmi-card">

          <div className="card-title">
            แนวโน้ม BMI ย้อนหลัง
          </div>

          <div className="bmi-placeholder">
            {bmiRecords.length > 0 ? (
              bmiRecords.map((item, index) => (
                <div key={index}>
                  BMI : {item.bmi}
                </div>
              ))
            ) : (
              <div>ไม่มีข้อมูล BMI</div>
            )}
          </div>

        </div>

        <div className="advice-card">

          <div className="card-title">
            คำแนะนำจากผู้เชี่ยวชาญ
          </div>

          <div className="advice-box">
            <h4>{clinicType}</h4>

            <p>
              {advice?.advice ||
                "แนะนำให้ออกกำลังกายสม่ำเสมอ และพักผ่อนให้เพียงพอ"}
            </p>
          </div>

        </div>

      </div>

      <div className="timeline-section">

        <h2>
          ประวัติการเข้ารับบริการ (ออนไลน์)
        </h2>

        {timelineEvents.length > 0 ? (
          timelineEvents.map((item, index) => (
            <div
              key={index}
              className="timeline-card"
            >
              <div className="timeline-icon">
                📅
              </div>

              <div className="timeline-content">

                <div className="timeline-title">
                  {item.title}
                </div>

                <div className="timeline-date">
                  {item.date}
                </div>

              </div>

              <button className="timeline-btn">
                ดูเพิ่มเติม
              </button>
            </div>
          ))
        ) : (
          <div className="empty-timeline">
            ไม่มีประวัติการเข้ารับบริการ
          </div>
        )}

      </div>

    </div>
  );
}