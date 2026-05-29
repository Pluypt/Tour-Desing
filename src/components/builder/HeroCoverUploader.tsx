"use client";

import { useRef, useState } from "react";

type HeroCoverUploaderProps = {
  planId: string;
  heroImageUrl: string | null;
  onUpdate: (url: string | null) => void;
};

export default function HeroCoverUploader({ planId, heroImageUrl, onUpdate }: HeroCoverUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ---- Upload from file ----
  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP)");
      return;
    }

    setUploading(true);
    
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          URL.revokeObjectURL(objectUrl);
          
          // Canvas compression
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          const maxDim = 1200;
          
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("ไม่สามารถใช้งานระบบบีบอัดภาพได้");
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 80% to save bandwidth and DB storage
          const base64 = canvas.toDataURL("image/jpeg", 0.8);
          
          const res = await fetch(`/api/tour-plans/${planId}/upload-cover`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          
          if (!res.ok) {
            let errMsg = `Server responded with status ${res.status}`;
            try { 
              const errData = await res.json(); 
              if (errData.error) errMsg = errData.error; 
            } catch(e) {}
            throw new Error(errMsg);
          }
          
          const data = await res.json();
          if (data.success) {
            onUpdate(data.heroImageUrl);
          } else {
            alert("อัพโหลดไม่สำเร็จ: " + (data.error || "unknown error"));
          }
        } catch (error: any) {
          console.error("Upload error:", error);
          alert("เกิดข้อผิดพลาดในการอัพโหลด: " + (error.message || "Unknown error"));
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert("ไฟล์รูปภาพเสียหาย หรือไม่สามารถอ่านได้");
        setUploading(false);
      };
      
      img.src = objectUrl;
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเตรียมไฟล์");
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ---- AI Generate ----
  const handleGenerateAI = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tour-plans/${planId}/generate-cover-portrait`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        onUpdate(data.heroImageUrl);
      } else {
        alert("AI สร้างรูปไม่สำเร็จ: " + (data.error || "unknown error"));
      }
    } finally {
      setGenerating(false);
    }
  };

  // ---- Remove ----
  const handleRemove = async () => {
    if (!confirm("ลบรูปหน้าปกนี้?")) return;
    const res = await fetch(`/api/tour-plans/${planId}/upload-cover`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: null }),
    });
    if (res.ok) onUpdate(null);
  };

  const isLoading = uploading || generating;

  return (
    <div style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
      {/* Label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <label style={{ fontSize: "0.78rem", color: "var(--pr-text-muted)", fontWeight: 600 }}>
          รูปหน้าปก (3:4)
        </label>
        {heroImageUrl && (
          <button
            onClick={handleRemove}
            style={{
              fontSize: "0.7rem", color: "var(--pr-text-muted)", background: "none",
              border: "none", cursor: "pointer", padding: "0",
            }}
          >
            ✕ ลบ
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Drop zone / Preview */}
      {heroImageUrl ? (
        /* --- Preview รูปที่เลือก --- */
        <div style={{ position: "relative" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImageUrl}
            alt="cover preview"
            style={{
              width: "100%",
              aspectRatio: "3 / 4",
              objectFit: "cover",
              borderRadius: "8px",
              display: "block",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          {/* Overlay buttons */}
          <div
            style={{
              position: "absolute", inset: 0, borderRadius: "8px",
              background: "rgba(0,0,0,0)",
              display: "flex", flexDirection: "column",
              justifyContent: "flex-end", alignItems: "stretch",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
          >
            <div style={{ padding: "8px", display: "flex", gap: "6px" }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                style={{
                  flex: 1, fontSize: "0.72rem", padding: "5px 0",
                  borderRadius: "6px", border: "none", cursor: "pointer",
                  background: "rgba(255,255,255,0.92)", color: "#333", fontWeight: 600,
                }}
              >
                📤 เปลี่ยนรูป
              </button>
              <button
                onClick={handleGenerateAI}
                disabled={isLoading}
                style={{
                  flex: 1, fontSize: "0.72rem", padding: "5px 0",
                  borderRadius: "6px", border: "none", cursor: "pointer",
                  background: "rgba(211,47,47,0.92)", color: "#fff", fontWeight: 600,
                }}
              >
                {generating ? "⏳ กำลังสร้าง..." : "✨ AI ใหม่"}
              </button>
            </div>
          </div>
          {/* Loading overlay */}
          {isLoading && (
            <div style={{
              position: "absolute", inset: 0, borderRadius: "8px",
              background: "rgba(0,0,0,0.55)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "8px",
            }}>
              <div style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ color: "#fff", fontSize: "0.75rem" }}>
                {uploading ? "กำลังอัพโหลด..." : "AI กำลังสร้างรูป..."}
              </span>
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        /* --- Drop Zone (ยังไม่มีรูป) --- */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            width: "100%",
            aspectRatio: "3 / 4",
            borderRadius: "8px",
            border: `2px dashed ${dragOver ? "var(--pr-red)" : "var(--border-color)"}`,
            backgroundColor: dragOver ? "rgba(211,47,47,0.04)" : "var(--pr-gray-100)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => !isLoading && fileInputRef.current?.click()}
        >
          {isLoading ? (
            <>
              <div style={{ width: "36px", height: "36px", border: "3px solid var(--border-color)", borderTopColor: "var(--pr-red)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--pr-text-muted)" }}>
                {uploading ? "กำลังอัพโหลด..." : "AI กำลังสร้างรูป..."}
              </span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          ) : (
            <>
              <div style={{ fontSize: "2rem", opacity: 0.4 }}>🖼️</div>
              <div style={{ textAlign: "center", padding: "0 12px" }}>
                <div style={{ fontSize: "0.78rem", color: "var(--pr-text-muted)", fontWeight: 600, marginBottom: "4px" }}>
                  วางรูปที่นี่ หรือคลิกเพื่อเลือก
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--pr-text-muted)", opacity: 0.7 }}>
                  JPG / PNG / WEBP • สูงสุด 10MB
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleGenerateAI(); }}
                disabled={isLoading}
                style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "0.76rem",
                  border: "1.5px solid var(--pr-red)", cursor: "pointer",
                  background: "rgba(211,47,47,0.08)", color: "var(--pr-red)",
                  fontWeight: 700, transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--pr-red)"; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(211,47,47,0.08)"; e.currentTarget.style.color = "var(--pr-red)"; }}
              >
                ✨ AI สร้างรูปอัตโนมัติ
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
