const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const axios = require('axios');

// 创建Express应用
const app = express();
app.use(bodyParser.json());

// OpenAI配置
const openai = new OpenAI({
    apiKey: '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'
});

// generateContent函数
async function generateContent(messageContent) {
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
        return { success: true, generatedText };
    } catch (error) {
        console.error('发生错误:', error);
        // 检测API密钥错误
        if (error.response && error.response.status === 401) {
            return { success: false, message: 'API密钥不可使用' };
        } else {
            return { success: false, message: '请求处理错误' };
        }
    }
}

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
    综上所述: ''
};

// API端点
app.post('/generate-content', async (req, res) => {
    const { adder, wpApiUrl, username, password } = req.body;

    try {
        // 调用generateContent生成内容
        const articleResult = await generateContent(`生成一条关于${adder}的文章,要求：扩展性可以较高,随机组词，不需要特殊符号`);
        const titleResult = await generateContent(`生成一条关于${adder}的标题,要求：扩展性可以较高,随机组词，标题中不要带特殊符号`);
        const descriptionResult = await generateContent(`生成一条关于${adder}的描述.要求：扩展性可以较高,随机组词，40个字左右，不需要特殊符号`);
        const keywordsResult = await generateContent(`生成关于${adder}的搜索关键词5个 要求：扩展性可以较高,随机组词,顿号分割，不需要特殊符号`);
        // 检查是否有API密钥错误
        if (!articleResult.success || !titleResult.success || !descriptionResult.success || !keywordsResult.success) {
            return res.status(401).send({ status: 'error', message: 'API密钥不可使用' });
        }
        // 构建正则表达式的模式
        const pattern = new RegExp(Object.keys(replacements).join("|"), "g");
        // 替换后的文本
        const replacedText = articleResult.generatedText.replace(pattern, match => replacements[match]);
        // 准备WordPress请求数据
        const token = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
        const postData = {
            title: titleResult.generatedText,
            content: replacedText,
            status: 'publish',
            meta: {
                _yoast_wpseo_title: titleResult.generatedText,
                _yoast_wpseo_metadesc: descriptionResult.generatedText,
                _yoast_wpseo_focuskw: keywordsResult.generatedText
            }
        };
        // 发送请求到WordPress
        const response = await axios({
            method: 'post',
            url: `${wpApiUrl}/wp/v2/posts`,
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            },
            data: postData
        });
        // 成功响应
        res.send({ status: 'success', message: '文章创建成功', data: response.data });
    } catch (error) {
        console.error('创建文章失败', error);
        res.status(500).send({ status: 'error', message: '内部服务器错误' });
    }
});
// 启动服务器
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
