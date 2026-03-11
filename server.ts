import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://hilmbnyfdcxpowwyyjif.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/chapters", async (req, res) => {
    const { subject, grade } = req.query;
    try {
      let query = supabase
        .from('chap_ters')
        .select('*');
      
      if (subject) query = query.eq('subject', subject);
      if (grade) query = query.eq('grade', grade);
      
      const { data: chapters, error: chapterError } = await query.order('sort_order');

      if (chapterError) throw chapterError;

      const result = await Promise.all(chapters.map(async (chapter: any) => {
        const { data: lessons, error: lessonError } = await supabase
          .from('lessons')
          .select('*')
          .eq('chapter_id', chapter.id)
          .order('sort_order');
        
        if (lessonError) throw lessonError;
        return { ...chapter, lessons };
      }));

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin CRUD Routes
  app.post("/api/chapters", async (req, res) => {
    const { title, subject, grade, sort_order } = req.body;
    const { data, error } = await supabase.from('chap_ters').insert([{ title, subject, grade, sort_order }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  app.delete("/api/chapters/:id", async (req, res) => {
    const { error } = await supabase.from('chap_ters').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.put("/api/chapters/:id", async (req, res) => {
    const { data, error } = await supabase.from('chap_ters').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  app.post("/api/lessons", async (req, res) => {
    const { chapter_id, title, description, sort_order } = req.body;
    const { data, error } = await supabase.from('lessons').insert([{ chapter_id, title, description, sort_order }]).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  app.delete("/api/lessons/:id", async (req, res) => {
    const { error } = await supabase.from('lessons').delete().eq('id', req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.put("/api/lessons/:id", async (req, res) => {
    const { data, error } = await supabase.from('lessons').update(req.body).eq('id', req.params.id).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  });

  // Content CRUD
  app.post("/api/content/:type", async (req, res) => {
    const { type } = req.params;
    const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : 'practice_exercises';
    
    // Loại bỏ các trường không được phép cập nhật/chèn
    const { id: _, created_at: __, ...insertData } = req.body;
    
    // Xử lý đặc biệt cho bảng 'examples' nếu nó yêu cầu cấu trúc phẳng
    if (table === 'examples' && insertData.items && insertData.items.length > 0) {
      insertData.problem = insertData.items[0].problem;
      insertData.solution = insertData.items[0].solution;
      delete insertData.items;
    }
    
    console.log(`Inserting into ${table} with:`, insertData);
    const { data, error } = await supabase.from(table).insert([insertData]).select();
    if (error) {
      console.error(`Supabase insert error in ${table}:`, error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
  });

  app.delete("/api/content/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : 'practice_exercises';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.put("/api/content/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : 'practice_exercises';
    
    // Loại bỏ các trường không được phép cập nhật
    const { id: _, created_at: __, ...updateData } = req.body;
    
    const { data, error } = await supabase.from(table).update(updateData).eq('id', id).select();
    if (error) {
      console.error(`Supabase update error in ${table}:`, error);
      return res.status(500).json({ error: error.message });
    }
    res.json(data[0]);
  });

  app.get("/api/lessons/:id", async (req, res) => {
    const lessonId = req.params.id;
    try {
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      const [formulasRes, examplesRes, practiceRes] = await Promise.all([
        supabase.from('formulas').select('*').eq('lesson_id', lessonId),
        supabase.from('examples').select('*').eq('lesson_id', lessonId),
        supabase.from('practice_exercises').select('*').eq('lesson_id', lessonId)
      ]);

      res.json({
        ...lesson,
        formulas: formulasRes.data || [],
        examples: examplesRes.data || [],
        practice: (practiceRes.data || []).map(p => ({
          ...p,
          items: p.items || [{ problem: p.problem || '', hint: p.hint || '', answer: p.answer || '' }]
        }))
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
