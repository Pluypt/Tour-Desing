"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type DayImage = {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  source_url: string | null;
  source_title: string | null;
  provider: string | null;
  location_name: string | null;
  search_keyword: string | null;
  alt_text: string | null;
  caption: string | null;
  is_selected: boolean;
  sort_order: number;
};

type DayKeyword = { keyword: string; location_name: string };

export default function DailyImageGallery({
  dayId,
  dayNumber,
  dayTitle,
  keywords,
}: {
  dayId: string;
  dayNumber: number;
  dayTitle: string | null;
  keywords?: DayKeyword[];
}) {
  const [images, setImages] = useState<DayImage[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    const res = await fetch(`/api/tour-days/${dayId}/images`);
    const data = await res.json();
    if (data.success) setImages(data.images);
  }, [dayId]);

  useEffect(() => { fetchImages(); }, [fetchImages]);

  const handleSearch = async () => {
    if (!keywords || keywords.length === 0) {
      alert("ยังไม่มี keywords กรุณากด Generate Keywords ก่อน");
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/tour-days/${dayId}/search-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: keywords.map(k => k.keyword) }),
      });
      const data = await res.json();
      if (data.success) {
        setImages(data.images);
      } else {
        alert("ค้นหารูปไม่สำเร็จ: " + (data.error || "unknown error"));
      }
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const res = await fetch(`/api/tour-days/${dayId}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image_url: base64,
            provider: "manual_upload",
            alt_text: file.name,
            location_name: "อัพโหลดเอง",
            sort_order: images.length,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setImages(prev => [...prev, data.image]);
        } else {
          alert("อัพโหลดรูปไม่สำเร็จ: " + (data.error || "unknown error"));
        }
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    await fetch(`/api/tour-days/${dayId}/images/${imageId}`, { method: "DELETE" });
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div style={{ marginBottom: "20px", padding: "14px", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>DAY {dayNumber}</span>
          <span style={{ color: "var(--pr-text-muted)", fontSize: "0.85rem", marginLeft: "8px" }}>{dayTitle || ""}</span>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            style={{ display: "none" }} 
          />
          <button
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || searching}
            style={{ padding: "5px 12px", fontSize: "0.8rem", backgroundColor: "var(--pr-gray-200)" }}
          >
            {uploading ? "กำลังอัพโหลด..." : "📤 อัพโหลดรูปภาพ"}
          </button>
          <button
            className="btn-secondary"
            onClick={handleSearch}
            disabled={searching || uploading}
            style={{ padding: "5px 12px", fontSize: "0.8rem" }}
          >
            {searching ? "กำลังค้นหา..." : "🔍 ค้นหารูปภาพ"}
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <div style={{ color: "var(--pr-text-muted)", fontSize: "0.8rem", padding: "10px 0" }}>
          ยังไม่มีรูปภาพ — กด "ค้นหารูปภาพ" เพื่อดึงรูปจากสถานที่ในวันนี้
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {images.map(img => (
            <div key={img.id} style={{ position: "relative", borderRadius: "6px", overflow: "hidden", aspectRatio: "4/3", backgroundColor: "#eee" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnail_url || img.image_url}
                alt={img.alt_text || img.location_name || ""}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              {/* Overlay controls */}
              <div style={{
                position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0)", display: "flex",
                flexDirection: "column", justifyContent: "flex-end",
                transition: "background-color 0.2s",
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.45)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0)")}
              >
                <div style={{ padding: "6px", display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                  {img.source_url && (
                    <a
                      href={img.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#333", padding: "2px 6px", borderRadius: "3px", fontSize: "10px", textDecoration: "none" }}
                      title="ดูแหล่งที่มา"
                    >
                      🔗
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(img.id)}
                    style={{ backgroundColor: "rgba(211,47,47,0.9)", color: "white", border: "none", padding: "2px 6px", borderRadius: "3px", fontSize: "10px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {/* Provider badge */}
              <div style={{ position: "absolute", top: "4px", left: "4px", backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "9px", padding: "1px 5px", borderRadius: "3px" }}>
                {img.provider || "web"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copyright warning */}
      <div style={{ marginTop: "8px", fontSize: "10px", color: "#f57c00", backgroundColor: "#fff8e1", padding: "4px 8px", borderRadius: "4px" }}>
        ⚠️ ตรวจสอบสิทธิ์การใช้รูปภาพก่อนนำไปใช้ในเอกสารเชิงพาณิชย์
      </div>
    </div>
  );
}
