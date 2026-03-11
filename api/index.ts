import express from "express";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || "https://hilmbnyfdcxpowwyyjif.supabase.co";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// API Routes (copied from server.ts)
app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Sai mật khẩu" });
  }
});

app.post("/api/upload-image", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const { originalname, buffer, mimetype } = req.file;
  const fileName = `${Date.now()}_${originalname}`;
  
  const { data, error } = await supabase.storage
    .from('images')
    .upload(fileName, buffer, {
      contentType: mimetype
    });
    
  if (error) return res.status(500).json({ error: error.message });
  
  const { data: publicUrlData } = supabase.storage
    .from('images')
    .getPublicUrl(fileName);
    
  res.json({ url: publicUrlData.publicUrl });
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

app.post("/api/content/:type", async (req, res) => {
  const { type } = req.params;
  const table = type === 'formula' ? 'formulas' : type === 'example' ? 'examples' : 'practice_exercises';
  
  const { id: _, created_at: __, ...insertData } = req.body;
  
  if (table === 'examples' && insertData.items && insertData.items.length > 0) {
    insertData.problem = insertData.items[0].problem;
    insertData.solution = insertData.items[0].solution;
    delete insertData.items;
  }
  
  const { data, error } = await supabase.from(table).insert([insertData]).select();
  if (error) {
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
  
  const { id: _, created_at: __, ...updateData } = req.body;
  
  const { data, error } = await supabase.from(table).update(updateData).eq('id', id).select();
  if (error) {
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

export default app;
