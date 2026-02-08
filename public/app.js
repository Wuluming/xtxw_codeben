const app = Vue.createApp({
    data() {
        return {
            inputValue: '',
            markdownOutput: '',
            isLoading: false,
            isDarkMode: false,
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
            </div>

            <div class="output-section">
                <h2>Converted Markdown:</h2>
                <div class="markdown-output" v-html="markdownOutput"></div>
            </div>
        </div>
    `
}).mount('#app');
