import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, X, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';

interface GalleryViewerProps {
  images: string[];
  title: string;
}

export function GalleryViewer({ images, title }: GalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      
      for (let i = 0; i < images.length; i++) {
        const url = images[i];
        
        // Create an image element to get dimensions
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        // Add page if not the first page
        if (i > 0) pdf.addPage();

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const ratio = img.width / img.height;
        let imgWidth = pdfWidth - 20; // 10mm margin each side
        let imgHeight = imgWidth / ratio;
        
        if (imgHeight > pdfHeight - 20) {
          imgHeight = pdfHeight - 20;
          imgWidth = imgHeight * ratio;
        }

        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
      }
      
      pdf.save(`${title.replace(/\s+/g, '_')}_images.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Không thể xuất PDF. Vui lòng kiểm tra lại kết nối mạng hoặc quyền truy cập ảnh.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-600">
          <FileText size={20} />
          <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Chế độ duyệt ảnh bài học</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200 disabled:opacity-50"
          >
            <Download size={14} />
            {isExporting ? 'Đang xuất PDF...' : 'Xuất PDF'}
          </button>
        </div>
      </div>

      <div className="relative aspect-[3/4] md:aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={images[currentIndex]}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="max-w-full max-h-full object-contain"
            alt={`Page ${currentIndex + 1}`}
          />
        </AnimatePresence>

        {/* Controls Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between pointer-events-none group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-4 pointer-events-auto">
            <button
              onClick={handlePrev}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-white font-bold text-sm bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
              {currentIndex + 1} / {images.length}
            </span>
            <button
              onClick={handleNext}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronRight size={24} />
            </button>
          </div>
          
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all pointer-events-auto active:scale-90"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide py-2">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`relative flex-shrink-0 w-20 h-28 rounded-xl overflow-hidden border-2 transition-all ${
              currentIndex === idx ? 'border-emerald-500 scale-105 shadow-md shadow-emerald-100' : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={img} className="w-full h-full object-cover" alt={`Thumbnail ${idx + 1}`} />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">{idx + 1}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 md:p-8"
          >
            <button 
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
            >
              <X size={24} />
            </button>
            
            <img 
              src={images[currentIndex]} 
              className="max-w-full max-h-full object-contain" 
              alt="Fullscreen view" 
            />

            <div className="absolute inset-y-0 left-0 flex items-center pl-4 md:pl-8">
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronLeft size={32} />
              </button>
            </div>
            
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 md:pl-8">
              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="p-4 bg-white/5 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <ChevronRight size={32} />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white font-bold text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
