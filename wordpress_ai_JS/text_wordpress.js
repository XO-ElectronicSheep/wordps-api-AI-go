const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const filePath = './adder.txt';
const path = './apiKeys.txt';

let adder;



// 定义要替换的关键词和对应的替换内容
const replacements = {
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
async function checkApiKeyValidity(apiKey) {
    // 用于检查API密钥的有效性和余额
    // 如果API密钥有效且余额充足，返回true，否则返回false
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
function removeApiKeyFromFile(apiKey) {
    let apiKeys = fs.readFileSync(path, 'utf-8').split('\n');
    apiKeys = apiKeys.filter(key => key !== apiKey);
    fs.writeFileSync(path, apiKeys.join('\n'), 'utf-8');
}
function getValidApiKey() {
    let apiKeys = fs.readFileSync(path, 'utf-8').split('\n');
    for (let i = 0; i < apiKeys.length; i++) {
        if (checkApiKeyValidity(apiKeys[i])) {
            return apiKeys[i];
        } else {
            removeApiKeyFromFile(apiKeys[i]);
        }
    }
    throw new Error('没有找到有效的key');
}

// gpt3.5生成文本
async function generateContent(messageContent) {
    let apiKey = getValidApiKey();
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
            removeApiKeyFromFile(apiKey);
            return generateContent(messageContent);
        }
        throw error;
    }
}


// 获取 WordPress 分类目录
async function getCategories() {
    try {
        const response = await axios.get('https://www.yunche06.com/wp-json/wp/v2/categories');
        return response.data;
    } catch (error) {
        console.error(error);
    }
}


// 主函数 内容加工 文章展示
async function main() {
    const articleText = await generateContent(`生成一条关于${adder}的文章 要求：扩展性可以较高,随机组词，不需要特殊符号`);
    const titleText = await generateContent(`生成一条关于${adder}的标题 要求：扩展性可以较高,随机组词，标题中不要带特殊符号`);
    const description = await generateContent(`生成一条关于${adder}的描述 要求：扩展性可以较高,随机组词，40个字左右，不需要特殊符号`);
    const keywords = await generateContent(`生成关于${adder}的搜索关键词5个 要求：扩展性可以较高,随机组词,顿号分割，不需要特殊符号`);
    // 构建正则表达式的模式
    const pattern = new RegExp(Object.keys(replacements).join("|"), "g");
    // 替换后的文本
    const replacedText = articleText.replace(pattern, match => replacements[match]);
    // 你的 WordPress 网站信息
    const wpApiUrl = 'https://www.yunche06.com/wp-json';
    const username = 'sunjian';
    const password = 'jkNcNZ03IniwwE1z1O6kGSrA';
    const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');

    // 获取分类目录
    const categories = await getCategories();
    const randomCategory = categories[Math.floor(Math.random() * categories.length)].id;
    //wordpress 文章数据
    const postData = {
        title: titleText,
        content: replacedText,
        categories: [randomCategory],
        status: 'publish',
        meta: {
            _yoast_wpseo_title: titleText,
            _yoast_wpseo_metadesc: description,
            _yoast_wpseo_focuskw: keywords
        }
    };
    // 创建文章
    axios({
        method: 'post',
        url: `${wpApiUrl}/wp/v2/posts`,
        headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
        },
        data: postData
    })
        .then(response => {
            console.log('文章创建成功', response.data);
            getNumber++
        })
        .catch(error => {
            console.error('创建文章失败', error);
        });
}
main();
