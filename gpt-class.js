const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = './apiKeys.txt';
class ContentGenerator {
    // 构造函数
    constructor() {
        this.replacements = {
            首先: "",
            一旦: "",
            最后: "",
            此外: "",
            当然: "",
            所以: "",
            接下来: '',
            总之: '',
            最终: '',
            其次: '',
            另外: '',
            综上所述: '',
            总的来说: ''
        };
        this.wpApiUrl = 'https://www.yunche06.com/wp-json';
        this.username = 'sunjian';
        this.password = 'jkNcNZ03IniwwE1z1O6kGSrA';
        this.apiKeys = [];
        this.adderFilePath = './adder.txt';
        this.adder = this.getAndRemoveAdderFromFile();
    }

    getAndRemoveAdderFromFile() {
        const content = fs.readFileSync(this.adderFilePath, 'utf-8');
        const variables = content.split('\n');
        if (variables.length > 0) {
            const adder = variables.shift().trim();
            fs.writeFileSync(this.adderFilePath, variables.join('\n'), 'utf-8');
            return adder;
        } else {
            throw new Error('文件中没有变量了');
        }
    }
    

    setAdder(newAdder) {
        this.adder = newAdder;
    }
    // 检查API密钥是否有效
    async checkApiKeyValidity(apiKey) {
        const openai = new OpenAI({ apiKey });
        try {
            await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: 'test' }],
                stream: true,
                temperature: 0.9
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    // 从文件中删除无效的API密钥
    removeApiKeyFromFile(apiKey) {
        this.apiKeys = this.apiKeys.filter(key => key !== apiKey);
        fs.writeFileSync(path, this.apiKeys.join('\n'), 'utf-8');
    }

    // 从文件中获取有效的API密钥
    getValidApiKey() {
        for (const apiKey of this.apiKeys) {
            if (this.checkApiKeyValidity(apiKey)) {
                return apiKey;
            } else {
                this.removeApiKeyFromFile(apiKey);
            }
        }
        throw new Error('没有找到有效的key');
    }

    // gpt3.5生成文本
    async generateContent(messageContent) {
        const apiKey = this.getValidApiKey();
        const openai = new OpenAI({ apiKey });
        try {
            const stream = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: messageContent }],
                stream: true,
                temperature: 0.9
            });
            let generatedText = "";
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                generatedText += content;
            }
            return generatedText;
        } catch (error) {
            if (error.message.includes('key资金不足')) {
                this.removeApiKeyFromFile(apiKey);
                return this.generateContent(messageContent);
            }
            throw error;
        }
    }


    // 创建文章
    async createArticle() {
        const articleText = await this.generateContent(`生成一条关于${this.adder}的文章 要求：扩展性可以较高,随机组词，不需要特殊符号`);
        const titleText = await this.generateContent(`生成一条关于${this.adder}的标题 要求：扩展性可以较高,随机组词，标题中不要带特殊符号`);
        const description = await this.generateContent(`生成一条关于${this.adder}的描述 要求：扩展性可以较高,随机组词，40个字左右，不需要特殊符号`);
        const keywords = await this.generateContent(`生成关于${this.adder}的搜索关键词5个 要求：扩展性可以较高,随机组词,顿号分割，不需要特殊符号`);

        const pattern = new RegExp(Object.keys(this.replacements).join("|"), "g");
        const replacedText = articleText.replace(pattern, match => this.replacements[match]);

        const postData = {
            title: titleText,
            content: replacedText,
            status: 'publish',
            meta: {
                _yoast_wpseo_title: titleText,
                _yoast_wpseo_metadesc: description,
                _yoast_wpseo_focuskw: keywords
            }
        };

        const token = Buffer.from(`${this.username}:${this.password}`, 'utf8').toString('base64');

        try {
            const response = await axios({
                method: 'post',
                url: `${this.wpApiUrl}/wp/v2/posts`,
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json'
                },
                data: postData
            });
            console.log('文章创建成功', response.data);
        } catch (error) {
            console.error('创建文章失败', error);
        }
    }


    // 执行函数
    async execute() {
        for (let i = 0; i < 5; i++) {
            await this.createArticle();
        }
    }
}


// 创建实例并执行
const contentGenerator = new ContentGenerator();
contentGenerator.execute();
