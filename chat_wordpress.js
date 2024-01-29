const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const filePath = './adder.txt';
const path = './apiKeys.txt';
const adder = '';


// 读取文件内容并处理
async function processFile() {
    try {
        // 逐行读取文件
        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });

        for await (const line of rl) {
            // 处理每一行的变量
            const addr = line.trim(); // 获取变量并赋值给addr变量
            console.log('Processing variable:', addr);

            // 这里可以进行其他操作，例如使用addr进行一些处理

            adder = addr

            // 将文件中的该行删除
            removeLineFromFile(filePath, line);
        }

        console.log('File processing complete.');
    } catch (error) {
        console.error('Error reading file:', error);
    }
}

// 从文件中删除指定行
function removeLineFromFile(filePath, lineToRemove) {
    const data = fs.readFileSync(filePath, 'utf8').split('\n');

    const updatedData = data.filter((line) => line !== lineToRemove);

    fs.writeFileSync(filePath, updatedData.join('\n'));
}

const getNumber = 0
if (getNumber === 100) {
    // 重置计数器 并进行下一次循环
    // 启动文件处理
    processFile();
    getNumber = 0
} else if (getNumber === 0) {
    // 启动文件处理
    processFile();
} else if (getNumber < 100 && getNumber > 0) {
    return
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
    综上所述: '',
    总的来说: ''
};
/* const openai = new OpenAI({
    apiKey: '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'
}); */
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
    //wordpress 文章数据
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
