const WechatAPI = require('wechat-api');
const axios = require('axios');

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

// Upload image to Wechat
async function uploadImage(imagePath) {
    return new Promise((resolve, reject) => {
        api.uploadMaterial(imagePath, 'image', (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.url); // The URL of the uploaded image
            }
        });
    });
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
    publishArticle
};
