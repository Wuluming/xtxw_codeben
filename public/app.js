const app = Vue.createApp({
    data() {
        return {
            inputValue: '',
            markdownOutput: '',
            isLoading: false,
            isDarkMode: false,\n            showWechatPublishModal: false,\n            wechatPublishTitle: '',\n            wechatPublishAuthor: '',\n            wechatPublishDigest: '',
        };
    },
    methods: {
        async convertToMarkdown() {
            this.isLoading = true;
            try {
                const response = await fetch('/convert', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: this.inputValue }),
                });
                const data = await response.json();
                this.markdownOutput = data.markdown;
            } catch (error) {
                console.error('Error:', error);
                this.markdownOutput = 'Error converting content to Markdown.';
            } finally {
                this.isLoading = false;
            }
        },
        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            document.body.classList.toggle('dark-mode', this.isDarkMode);
        },
        showPublishToWechatModal() {
            this.wechatPublishTitle = '';
            this.wechatPublishAuthor = '';
            this.wechatPublishDigest = '';
            this.showWechatPublishModal = true;
        },
        async publishToWechat() {
            if (!this.markdownOutput) {
                alert('No Markdown content to publish.');
                return;
            }
            this.isLoading = true;
            try {
                const response = await fetch('/wechat/publish', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: this.wechatPublishTitle,
                        markdownContent: this.markdownOutput,
                        author: this.wechatPublishAuthor,
                        digest: this.wechatPublishDigest,
                    }),
                });
                const data = await response.json();
                if (response.ok) {
                    alert('Article published to WeChat successfully!');
                    this.showWechatPublishModal = false;
                } else {
                    alert(`Error publishing to WeChat: ${data.error}`);
                }
            } catch (error) {
                console.error('Error publishing to WeChat:', error);
                alert('Failed to publish article to WeChat.');
            } finally {
                this.isLoading = false;
            }
        },
        copyMarkdown() {
            navigator.clipboard.writeText(this.markdownOutput).then(() => {
                alert('Markdown copied to clipboard!');
            }).catch(err => {
                console.error('Error copying text: ', err);
            });
        }
    },
    template: `
        <div id="app">
            <div class="theme-toggle">
                <button @click="toggleTheme">{{ isDarkMode ? 'Light Mode' : 'Dark Mode' }}</button>
            </div>
            <h1>Markdown AI Converter</h1>

            <div class="input-section">
                <textarea v-model="inputValue" placeholder="Enter text or URL here..."></textarea>
                <button @click="convertToMarkdown" :disabled="isLoading">{{ isLoading ? 'Converting...' : 'Convert to Markdown' }}</button>
                <button @click="copyMarkdown" :disabled="!markdownOutput" class="copy-button">Copy Markdown</button>
                <button @click="showPublishToWechatModal" :disabled="!markdownOutput" class="wechat-publish-button">同步到公众号</button>
            </div>

            <div class="output-section">
                <h2>Converted Markdown:</h2>
                <div class="markdown-output" v-html="markdownOutput"></div>
            </div>

            <!-- 微信公众号发布模态框 -->
            <div v-if="showWechatPublishModal" class="modal-overlay">
                <div class="modal-content">
                    <h3>发布到微信公众号</h3>
                    <div class="form-group">
                        <label for="wechatTitle">标题:</label>
                        <input type="text" id="wechatTitle" v-model="wechatPublishTitle" />
                    </div>
                    <div class="form-group">
                        <label for="wechatAuthor">作者:</label>
                        <input type="text" id="wechatAuthor" v-model="wechatPublishAuthor" />
                    </div>
                    <div class="form-group">
                        <label for="wechatDigest">摘要:</label>
                        <textarea id="wechatDigest" v-model="wechatPublishDigest"></textarea>
                    </div>
                    <div class="modal-actions">
                        <button @click="publishToWechat" :disabled="isLoading">
                            {{ isLoading ? '发布中...' : '发布' }}
                        </button>
                        <button @click="showWechatPublishModal = false">取消</button>
                    </div>
                </div>
            </div>
        </div>
    `
}).mount('#app');
