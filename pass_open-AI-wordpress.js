const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const mysql = require('mysql');
const path = './apiKeys.txt';
// 定义全局变量
let adder;
// 创建数据库连接
const connection = mysql.createConnection({
    host: 'mysql',
    user: 'root',
    password: 'mysql_jnDyzw',
    database: 'text',
});
async function connectToDatabase() {
    return new Promise((resolve, reject) => {
        // 连接数据库
        connection.connect((err) => {
            if (err) {
                console.error('Error connecting to database:', err);
                reject(err);
            } else {
                console.log('Connected to database successfully.');
                resolve();
            }
        });
    });
}
async function fetchDataFromIdGetTable() {
    return new Promise((resolve, reject) => {
        // 获取id_get表中的id属性
        connection.query('SELECT id, frequency FROM id_get', (err, results) => {
            if (err) {
                console.error('Error fetching ids and frequencies from id_get table:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}
async function updateIdAndGetAdder(results) {
    for (const row of results) {
        const id = row.id;
        const frequency = row.frequency;
        // 检查是否需要更新id和frequency
        if (frequency === 10) {
            // 更新id_get表中的id和frequency字段
            await updateIdAndGetTable(id);
            console.log('id and frequency in id_get table have been updated.');
            // 根据id获取data值，并赋值给全局变量adder
            const data = await getDataFromMyTable(id);
            adder = data; // 将data的值赋值给adder
            console.log('Data:', adder);
        } else {
            // 更新id_get表中的frequency字段值
            await updateFrequencyInIdGetTable(frequency, id);
            // 根据id获取data值，并赋值给全局变量adder
            const data = await getDataFromMyTable(id);
            adder = data; // 将data的值赋值给adder
            console.log('Data:', adder);
        }
        // 判断id_get表中的id值和my_table中的最后一行的id是否相等
        const lastId = await getLastIdFromMyTable();
        if (id === lastId) {
            // 将id_get表中的id值设为1
            await resetIdInIdGetTable();
            console.log('id in id_get table has been reset to 1.');
        }
    }
}
async function updateIdAndGetTable(id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE id_get SET id = id + 1, frequency = 0', (err, results) => {
            if (err) {
                console.error('Error updating id and frequency in id_get table:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}
async function updateFrequencyInIdGetTable(frequency, id) {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE id_get SET frequency = ? WHERE id = ?', [frequency + 1, id], (err, results) => {
            if (err) {
                console.error('Error updating frequency in id_get table:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}
async function getLastIdFromMyTable() {
    return new Promise((resolve, reject) => {
        connection.query('SELECT id FROM my_table ORDER BY id DESC LIMIT 1', (err, results) => {
            if (err) {
                console.error('Error fetching id from my_table:', err);
                reject(err);
            } else {
                resolve(results[0].id);
            }
        });
    });
}
async function resetIdInIdGetTable() {
    return new Promise((resolve, reject) => {
        connection.query('UPDATE id_get SET id = 1', (err, results) => {
            if (err) {
                console.error('Error updating id in id_get table:', err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}
async function getDataFromMyTable(id) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT data FROM my_table WHERE id = ?', [id], (err, results) => {
            if (err) {
                console.error('Error fetching data from my_table:', err);
                reject(err);
            } else {
                resolve(results[0].data);
            }
        });
    });
}
// 主函数
async function mainMysql() {
    try {
        await connectToDatabase();
        const results = await fetchDataFromIdGetTable();
        await updateIdAndGetAdder(results);
        // The rest of your code
        await main();
    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Close the database connection after all operations
        connection.end();
    }
}
// 运行sql函数
mainMysql();
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
    总结: '',
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
            model: "text-embedding-3-large",
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
            // Handle rate limiting by switching to the next key
            removeApiKeyFromFile(apiKey);
            return generateContent(messageContent);
        } else if (error.message.includes('Code: 429')) {
            // Handle general rate limiting by switching to the next key
            removeApiKeyFromFile(apiKey);
            return generateContent(messageContent);
        }
        throw error;
    }
}
// 获取 WordPress 分类目录
async function getCategories() {
    try {
        const response = await axios.get('https://www.yunche168.cn/wp-json/wp/v2/categories');
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

let num = 0
// 主函数 内容加工 文章展示
async function main() {
    const articleText = await generateContent(`生成一条关于${adder}的文章 要求：扩展性可以较高,随机组词，不需要特殊符号,500字左右`);
    const titleText = await generateContent(`生成一条关于${adder}的标题 要求：扩展性可以较高,随机组词，标题中不要带特殊符号`);
    const description = await generateContent(`生成一条关于${adder}的描述 要求：扩展性可以较高,随机组词，40个字左右，不需要特殊符号`);
    const keywords = description
    //await generateContent(`生成关于${adder}的搜索关键词5个 要求：扩展性可以较高,随机组词,顿号分割，不需要特殊符号`);
    // 构建正则表达式的模式
    const pattern = new RegExp(Object.keys(replacements).join("|"), "g");
    // 替换后的文本
    const replacedText = articleText.replace(pattern, match => replacements[match]);
    // 你的 WordPress 网站信息
    const wpApiUrl = 'https://www.yunche168.cn/wp-json';
    const username = 'keng';
    const password = 'O7g6Ht3ddeTK1DN9rv500mwz';
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
            return num = 1
        })
        .catch(error => {
            console.error('创建文章失败', error);
            return num = 2
        });
}

if (adder) {
    main();
}

if (num === 1) {
    console.log('文章书写完成');
    process.exit();
} else if (num === 2) {
    console.log('文章书写失败');
    process.exit();
}


