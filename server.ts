import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import OpenAI from 'openai';
import { toFile } from 'openai';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/generate-image', upload.single('image'), async (req: Request, res: Response): Promise<any> => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'OPENAI_API_KEY environment variable is required' });
      }

      const openai = new OpenAI({ apiKey });
      const prompt = req.body.prompt;
      
      let imageUrl = '';

      if (req.file) {
        // Edit mode
        const fileContent = await toFile(req.file.buffer, 'image.png', { type: 'image/png' });

        const response = await openai.images.edit({
          model: 'gpt-image-2',
          image: fileContent,
          prompt: prompt || 'Edit this image',
          response_format: 'b64_json',
        });
        
        if (response.data[0].b64_json) {
           imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
        } else {
           imageUrl = response.data[0].url || '';
        }
      } else {
        if (!prompt) {
          return res.status(400).json({ error: 'Prompt is required if no image is provided' });
        }
        
        // Generate mode
        const response = await openai.images.generate({
          model: 'gpt-image-2',
          prompt: prompt,
          response_format: 'b64_json',
        });
        
        if (response.data[0].b64_json) {
           imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
        } else {
           imageUrl = response.data[0].url || '';
        }
      }

      res.json({ imageUrl });

    } catch (error: any) {
      console.error('Error in generate-image:', error);
      res.status(500).json({ error: error.message || 'Error generating image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
