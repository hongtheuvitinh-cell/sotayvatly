import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import dotenv from "dotenv";
import Busboy from "busboy";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://hilmbnyfdcxpowwyyjif.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/login", (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (password === adminPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Sai mật khẩu" });
    }
  });

  app.post("/api/upload-image", (req, res) => {
    const busboy = Busboy({ headers: req.headers });
    let fileData: Buffer[] = [];
    let fileName = "";
    let mimeType = "";

    busboy.on("file", (fieldname, file, info) => {
      const { filename, mimeType: type } = info;
      fileName = `${Date.now()}_${filename}`;
      mimeType = type;
      file.on("data", (data) => fileData.push(data));
    });

    busboy.on("finish", async () => {
      const buffer = Buffer.concat(fileData);
      
      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, buffer, {
          contentType: mimeType
        });
        
      if (error) return res.status(500).json({ error: error.message });
      
      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
        
      res.json({ url: publicUrlData.publicUrl });
    });

    req.pipe(busboy);
  });

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
    const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : type === 'quiz' ? 'quizzes' : 'practice_exercises';
    
    // Loại bỏ các trường không được phép cập nhật/chèn
    const { id: _, created_at: __, ...insertData } = req.body;
    
    // Xử lý dữ liệu trước khi chèn/cập nhật cho bảng 'examples'
    if (table === 'examples') {
      // Đảm bảo các cột problem/solution luôn có giá trị để tránh lỗi NOT NULL
      insertData.problem = insertData.problem || '';
      insertData.solution = insertData.solution || '';
      
      if (insertData.items && insertData.items.length > 0) {
        insertData.problem = insertData.items[0].problem || insertData.problem;
        insertData.solution = insertData.items[0].solution || insertData.solution;
      }
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
    const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : type === 'quiz' ? 'quizzes' : 'practice_exercises';
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });

  app.put("/api/content/:type/:id", async (req, res) => {
    const { type, id } = req.params;
    const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : type === 'quiz' ? 'quizzes' : 'practice_exercises';
    
    // Loại bỏ các trường không được phép cập nhật
    const { id: _, created_at: __, ...updateData } = req.body;

    // Xử lý dữ liệu tương tự như khi insert cho bảng 'examples'
    if (table === 'examples') {
      if (updateData.items && updateData.items.length > 0) {
        updateData.problem = updateData.items[0].problem || updateData.problem || '';
        updateData.solution = updateData.items[0].solution || updateData.solution || '';
      }
    }
    
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

      const [formulasRes, examplesRes, practiceRes, quizzesRes] = await Promise.all([
        supabase.from('formulas').select('*').eq('lesson_id', lessonId),
        supabase.from('examples').select('*').eq('lesson_id', lessonId),
        supabase.from('practice_exercises').select('*').eq('lesson_id', lessonId),
        supabase.from('quizzes').select('*').eq('lesson_id', lessonId).order('sort_order')
      ]);

      res.json({
        ...lesson,
        formulas: formulasRes.data || [],
        examples: examplesRes.data || [],
        practice: (practiceRes.data || []).map(p => ({
          ...p,
          items: p.items || [{ problem: p.problem || '', hint: p.hint || '', answer: p.answer || '' }]
        })),
        quizzes: quizzesRes.data || []
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
