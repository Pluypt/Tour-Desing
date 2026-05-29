"use client";

import { useState, useEffect, useCallback } from "react";

type CoverData = {
  template_name: string;
  background_url: string;
  headline: string;
  subheadline: string;
  travel_date_text: string;
  price_text: string;
  badge_text: string;
  highlight_text: string;
  theme_color: string;
  text_color: string;
  overlay_style: string;
};

const TEMPLATES = ["Premium Proposal", "Sales Poster", "Minimal Luxury", "Family Friendly"];
const OVERLAY_STYLES = [
  { value: "dark", label: "มืด (Dark)" },
  { value: "light", label: "สว่าง (Light)" },
  { value: "gradient", label: "Gradient" },
  { value: "none", label: "ไม่มี" },
];

const DEFAULT_COVER: CoverData = {
  template_name: "Premium Proposal",
  background_url: "",
  headline: "",
  subheadline: "",
  travel_date_text: "",
  price_text: "",
  badge_text: "",
  highlight_text: "",
  theme_color: "#D32F2F",
  text_color: "#FFFFFF",
  overlay_style: "dark",
};

function getOverlayStyle(style: string, color: string): string {
  switch (style) {
    case "dark": return "linear-gradient(to right, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.3) 100%)";
    case "light": return "linear-gradient(to right, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.3) 100%)";
    case "gradient": return `linear-gradient(to right, ${color}cc 30%, transparent 100%)`;
    default: return "none";
  }
}

export default function CoverDesignerTab({ planId }: { planId: string }) {
  const [cover, setCover] = useState<CoverData>(DEFAULT_COVER);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatingText, setGeneratingText] = useState(false);

  const fetchCover = useCallback(async () => {
    const res = await fetch(`/api/tour-plans/${planId}/cover`);
    const data = await res.json();
    if (data.success && data.cover) {
      setCover({ ...DEFAULT_COVER, ...data.cover });
    }
  }, [planId]);

  useEffect(() => { fetchCover(); }, [fetchCover]);

  const handleChange = (field: keyof CoverData, value: string) => {
    setCover(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/tour-plans/${planId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cover),
      });
      alert("บันทึกหน้าปกเรียบร้อยแล้ว");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const res = await fetch(`/api/tour-plans/${planId}/cover/generate-image`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCover(prev => ({ ...prev, background_url: data.backgroundUrl }));
      } else {
        alert("สร้างภาพไม่สำเร็จ: " + data.error);
      }
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateText = async () => {
    setGeneratingText(true);
    try {
      const res = await fetch(`/api/tour-plans/${planId}/cover/generate-text`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCover(prev => ({
          ...prev,
          headline: data.texts.headline || prev.headline,
          subheadline: data.texts.subheadline || prev.subheadline,
          badge_text: data.texts.badge_text || prev.badge_text,
          highlight_text: data.texts.highlight_text || prev.highlight_text,
          price_text: data.texts.price_text || prev.price_text,
          travel_date_text: data.texts.travel_date_text || prev.travel_date_text,
        }));
      } else {
        alert("สร้างข้อความไม่สำเร็จ: " + data.error);
      }
    } finally {
      setGeneratingText(false);
    }
  };

  const overlayStyle = getOverlayStyle(cover.overlay_style, cover.theme_color);
  const textColor = cover.overlay_style === "light" ? "#222" : cover.text_color;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
      {/* Left: Editor */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>ออกแบบหน้าปก</h2>
          <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "8px 18px" }}>
            {saving ? "กำลังบันทึก..." : "บันทึกหน้าปก"}
          </button>
        </div>

        {/* Template */}
        <div className="form-group">
          <label className="form-label">เทมเพลต</label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {TEMPLATES.map(t => (
              <button
                key={t}
                onClick={() => handleChange("template_name", t)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "0.85rem", cursor: "pointer",
                  border: `2px solid ${cover.template_name === t ? "var(--pr-red)" : "var(--border-color)"}`,
                  backgroundColor: cover.template_name === t ? "rgba(211,47,47,0.08)" : "white",
                  color: cover.template_name === t ? "var(--pr-red)" : "var(--pr-text-main)",
                  fontWeight: cover.template_name === t ? 700 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Background Image */}
        <div className="form-group">
          <label className="form-label">ภาพพื้นหลัง</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              className="form-control"
              value={cover.background_url.startsWith("data:") ? "[AI Generated Image]" : cover.background_url}
              onChange={e => handleChange("background_url", e.target.value)}
              placeholder="URL รูปภาพ หรือกด Generate"
              readOnly={cover.background_url.startsWith("data:")}
            />
            <button
              className="btn-secondary"
              onClick={handleGenerateImage}
              disabled={generatingImage}
              style={{ whiteSpace: "nowrap", padding: "8px 14px", fontSize: "0.85rem" }}
            >
              {generatingImage ? "กำลังสร้าง..." : "🎨 AI สร้างภาพ"}
            </button>
          </div>
        </div>

        {/* AI Generate Text */}
        <div style={{ marginBottom: "16px" }}>
          <button
            className="btn-secondary"
            onClick={handleGenerateText}
            disabled={generatingText}
            style={{ fontSize: "0.85rem", padding: "8px 16px" }}
          >
            {generatingText ? "กำลังสร้างข้อความ..." : "✨ AI สร้างข้อความหน้าปก"}
          </button>
        </div>

        {/* Text Fields */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          {([
            ["headline", "หัวข้อหลัก (Headline)"],
            ["subheadline", "หัวข้อรอง (Subheadline)"],
            ["badge_text", "Badge (เช่น Private Tour)"],
            ["highlight_text", "จุดเด่น (Highlight)"],
            ["price_text", "ราคา (Price Text)"],
            ["travel_date_text", "วันที่เดินทาง"],
          ] as [keyof CoverData, string][]).map(([field, label]) => (
            <div key={field} className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: "0.85rem" }}>{label}</label>
              <input
                type="text"
                className="form-control"
                value={cover[field]}
                onChange={e => handleChange(field, e.target.value)}
                style={{ fontSize: "0.85rem" }}
              />
            </div>
          ))}
        </div>

        {/* Style Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginTop: "16px" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.85rem" }}>สีหลัก</label>
            <input type="color" value={cover.theme_color} onChange={e => handleChange("theme_color", e.target.value)} style={{ width: "100%", height: "38px", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.85rem" }}>สีตัวอักษร</label>
            <input type="color" value={cover.text_color} onChange={e => handleChange("text_color", e.target.value)} style={{ width: "100%", height: "38px", border: "1px solid var(--border-color)", borderRadius: "4px", cursor: "pointer" }} />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: "0.85rem" }}>Overlay</label>
            <select className="form-control" value={cover.overlay_style} onChange={e => handleChange("overlay_style", e.target.value)} style={{ fontSize: "0.85rem" }}>
              {OVERLAY_STYLES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Right: Live Preview */}
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--pr-text-muted)", marginBottom: "8px", fontWeight: 600 }}>ตัวอย่างหน้าปก</div>
        <div style={{
          width: "100%", aspectRatio: "3/4", borderRadius: "10px", overflow: "hidden",
          position: "relative", backgroundColor: "#222",
          backgroundImage: cover.background_url ? `url(${cover.background_url})` : undefined,
          backgroundSize: "cover", backgroundPosition: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {/* Overlay */}
          <div style={{ position: "absolute", inset: 0, background: overlayStyle }} />

          {/* Content */}
          <div style={{ position: "absolute", inset: 0, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "flex-end", color: textColor }}>
            {cover.badge_text && (
              <div style={{ backgroundColor: cover.theme_color, color: "white", padding: "2px 10px", borderRadius: "12px", fontSize: "10px", fontWeight: 700, width: "fit-content", marginBottom: "8px" }}>
                {cover.badge_text}
              </div>
            )}
            {cover.headline && (
              <div style={{ fontSize: "18px", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                {cover.headline}
              </div>
            )}
            {cover.subheadline && (
              <div style={{ fontSize: "11px", opacity: 0.9, marginBottom: "8px", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                {cover.subheadline}
              </div>
            )}
            <div style={{ display: "flex", gap: "12px", fontSize: "10px", opacity: 0.85 }}>
              {cover.travel_date_text && <span>📅 {cover.travel_date_text}</span>}
              {cover.price_text && <span style={{ color: "#FFD700", fontWeight: 700 }}>฿ {cover.price_text}</span>}
            </div>
          </div>

          {/* Logo area */}
          <div style={{ position: "absolute", top: "14px", left: "16px", color: textColor, fontSize: "10px", fontWeight: 700, opacity: 0.9, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>
            PR TRAVEL GROUP
          </div>
        </div>

        {!cover.background_url && (
          <p style={{ fontSize: "0.8rem", color: "var(--pr-text-muted)", textAlign: "center", marginTop: "8px" }}>
            กด "AI สร้างภาพ" เพื่อสร้างภาพพื้นหลัง
          </p>
        )}
      </div>
    </div>
  );
}
