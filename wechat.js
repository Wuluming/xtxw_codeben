const WechatAPI = require('wechat-api');
const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');

const appid = process.env.WECHAT_APP_ID;
const appsecret = process.env.WECHAT_APP_SECRET;

const api = new WechatAPI(appid, appsecret);

// Get access token
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        api.getAccessToken((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.accessToken);
            }
        });
    });
}

// Generate cover image (simplified example)
async function generateCover(title, outputPath) {
    try {
        // Wechat requires cover image to be 900px * 500px for better display
        await sharp({ create: { width: 900, height: 500, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0.5 } } })
            .composite([
                {
                    input: Buffer.from(`
                        <svg width=\"900\" height=\"500\">
                            <style>
                                .title { fill: #FFFFFF; font-size: 60px; font-weight: bold; text-align: center; }
                            </style>
                            <text x=\"50%\" y=\"250\" class=\"title\" dominant-baseline=\"middle\" text-anchor=\"middle\">${title}</text>
                        </svg>
                    `),
                    left: 0,
                    top: 0,
                },
            ])
            .png()
            .toFile(outputPath);
        return outputPath;
    } catch (error) {
        console.error('Error generating cover image:', error);
        throw error;
    }
}

// Upload image to Wechat
async function uploadImage(imagePath) {
    try {
        // Process image to fit Wechat requirements (e.g., resize, compress)
        const processedImagePath = `${imagePath}_processed.jpg`;
        await sharp(imagePath)
            .resize(720) // Resize to a common width for web
            .jpeg({ quality: 80 }) // Compress to JPEG with 80% quality
            .toFile(processedImagePath);

        return new Promise((resolve, reject) => {
            api.uploadMaterial(processedImagePath, 'image', (err, result) => {
                // Clean up processed image after upload
                fs.unlinkSync(processedImagePath);
                if (err) {
                    reject(err);
                } else {
                    resolve(result.url); // The URL of the uploaded image
                }
            });
        });
    } catch (error) {
        console.error('Error processing or uploading image:', error);
        throw error;
    }
}

// Publish article to Wechat
async function publishArticle(articles) {
    return new Promise((resolve, reject) => {
        api.uploadNews(articles, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.media_id); // The media_id of the published article
            }
        });
    });
}

module.exports = {
    getAccessToken,
    uploadImage,
    publishArticle,
    generateCover
};
