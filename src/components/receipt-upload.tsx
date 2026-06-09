"use client";

import { useRef, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { compressReceipt } from "@/lib/compress-receipt";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ReceiptUploadProps {
  onFileReady: (file: File | null, previewUrl: string | null) => void;
  disabled?: boolean;
}

export function ReceiptUpload({ onFileReady, disabled }: ReceiptUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleFile(file: File | null) {
    if (!file) return;
    setError("");
    setCompressing(true);
    try {
      const compressed = await compressReceipt(file);
      if (compressed.size > 512000) {
        setError("Image is still too large. Please take a closer photo or choose a smaller image.");
        setCompressing(false);
        return;
      }
      const url = URL.createObjectURL(compressed);
      setPreview(url);
      onFileReady(compressed, url);
    } catch {
      setError("Could not process image. Please try again.");
      onFileReady(null, null);
    } finally {
      setCompressing(false);
    }
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onFileReady(null, null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <Label>Receipt photo (optional)</Label>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={disabled || compressing}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || compressing}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={disabled || compressing}
          onClick={() => cameraInputRef.current?.click()}
        >
          {compressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {compressing ? "Compressing…" : "Camera"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={disabled || compressing}
          onClick={() => galleryInputRef.current?.click()}
        >
          {compressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {compressing ? "Compressing…" : "Gallery"}
        </Button>
        {preview && (
          <Button type="button" variant="secondary" onClick={clear}>
            Remove
          </Button>
        )}
      </div>
      {preview && (
        <div className="rounded-lg border overflow-hidden bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-contain" />
        </div>
      )}
      {!preview && !compressing && (
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <ImagePlus className="h-3 w-3" />
          Photos are resized automatically to save storage
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
