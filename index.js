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

app.post('/wechat/generate_cover', async (req, res) => {
    try {
        const { title } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required.' });
        }
        const outputPath = `./uploads/cover_${Date.now()}.png`;
        await wechat.generateCover(title, outputPath);
        res.json({ coverUrl: `/uploads/${outputPath.split('/').pop()}` });
    } catch (error) {
        console.error('Error generating cover:', error);
        res.status(500).json({ error: 'Failed to generate cover.' });
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

        const prompt = `你是一个专业的微信公众号文章排版助手。请将以下文本或HTML内容转换为微信公众号的排版风格，并生成3-5个相关的文章标签。确保标题、段落、图片、代码块等元素符合微信公众号的显示规范。特别注意以下几点：\\n1. 标题（H1-H4）应具有明确的层级和视觉区分度，可以使用表情符号或特殊字符增加吸引力。\\n2. 段落之间应有适当的行间距和首行缩进，避免内容过于拥挤。\\n3. 图片应居中显示，并可以添加图片描述。如果图片过多，请尝试进行智能筛选和压缩。\\n4. 代码块应有语法高亮，并保持清晰可读。可以用卡片或代码框的形式展示。\\n5. 列表项（无序和有序）应有统一的缩进和间距，并可以使用小图标或符号进行美化。\\n6. 引用块应有特殊的样式标识，如灰色背景或边框。\\n7. 文章内容应流畅，语言风格应更加生动活泼，符合微信公众号的阅读习惯。\\n8. 在Markdown内容之后，用“**标签：**”开头，列出3-5个与文章内容高度相关的关键词或短语作为文章标签。\\n\\n内容：\\n\\n\`\`\`\\n${textToConvert}\\n\`\`\`\\n\\nMarkdown:`;

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
