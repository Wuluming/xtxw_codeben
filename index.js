const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const MarkdownIt = require('markdown-it');
const mdHighlight = require('markdown-it-highlightjs');

require('dotenv').config();

const app = express();
const port = 3000;

const wechat = require('./wechat');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const md = new MarkdownIt().use(mdHighlight);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the 'public' directory
app.use('/uploads', express.static('uploads')); // Serve uploaded files statically

// Wechat API routes
app.get('/wechat/token', async (req, res) => {
    try {
        const accessToken = await wechat.getAccessToken();
        res.json({ accessToken });
    } catch (error) {
        console.error('Error getting Wechat access token:', error);
        res.status(500).json({ error: 'Failed to get Wechat access token.' });
    }
});

app.post('/wechat/upload_image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided.' });
        }
        const imageUrl = await wechat.uploadImage(req.file.path);
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error uploading image to Wechat:', error);
        res.status(500).json({ error: 'Failed to upload image to Wechat.' });
    }
});

app.post('/wechat/publish_article', async (req, res) => {
    try {
        const { articles } = req.body;
        if (!articles) {
            return res.status(400).json({ error: 'No article data provided.' });
        }
        const mediaId = await wechat.publishArticle(articles);
        res.json({ mediaId });
    } catch (error) {
        console.error('Error publishing article to Wechat:', error);
        res.status(500).json({ error: 'Failed to publish article to Wechat.' });
    }
});

// Initialize GoogleGenerativeAI with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/convert', async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({ error: 'Content is required.' });
    }

    let textToConvert = content;

    // Check if the content is a URL
    if (content.startsWith('http://') || content.startsWith('https://')) {
        try {
            const response = await axios.get(content);
            textToConvert = response.data; // Get the HTML content
        } catch (error) {
            console.error('Error fetching URL:', error.message);
            return res.status(500).json({ error: 'Failed to fetch content from the provided URL.' });
        }
    }

    try {
        // For text-only input, use the gemini-pro model
        const model = genAI.getGenerativeModel({ model: \"gemini-pro\" });

        const prompt = `将以下文本或HTML内容转换为微信公众号的排版风格。确保标题、段落、图片、代码块等元素符合微信公众号的显示规范。特别注意以下几点：\\n1. 标题（H1-H4）应具有明确的层级和视觉区分度。\\n2. 段落之间应有适当的行间距，避免内容过于拥挤。\\n3. 图片应居中显示，并可以添加图片描述。\\n4. 代码块应有语法高亮，并保持清晰可读。\\n5. 列表项（无序和有序）应有统一的缩进和间距。\\n6. 引用块应有特殊的样式标识。\\n7. 仅返回排版后的Markdown内容，不要包含任何其他文本。\\n\\n内容：\\n\\n\`\`\`\\n${textToConvert}\\n\`\`\`\\n\\nMarkdown:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiMarkdown = response.text();

        // Render the Markdown using markdown-it for display
        const html = md.render(aiMarkdown);

        res.json({ markdown: html });
    } catch (error) {
        console.error('Error converting with AI:', error);
        res.status(500).json({ error: 'Failed to convert content using AI.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
