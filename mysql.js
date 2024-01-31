const mysql = require('mysql');

// 创建数据库连接
const connection = mysql.createConnection({
    host: 'mysql',
    user: 'root',
    password: 'mysql_jnDyzw',
    database: 'text'
});

// 连接数据库
connection.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database successfully.');
    // 获取id_get表中的id属性
    connection.query('SELECT id, frequency FROM id_get', (err, results) => {
        if (err) {
            console.error('Error fetching ids and frequencies from id_get table:', err);
            connection.end(); // 关闭数据库连接
            return;
        }
        // 遍历每个id和frequency
        results.forEach(row => {
            const id = row.id;
            const frequency = row.frequency;
            // 检查是否需要更新id和frequency
            if (frequency === 10) {
                // 更新id_get表中的id和frequency字段
                connection.query('UPDATE id_get SET id = id + 1, frequency = 0', (err, results) => {
                    if (err) {
                        console.error('Error updating id and frequency in id_get table:', err);
                        connection.end(); // 关闭数据库连接
                        return;
                    }
                    console.log('id and frequency in id_get table have been updated.');
                    getDataFromMyTable(id); // 根据id获取data值
                });
            } else {
                // 更新id_get表中的frequency字段值
                connection.query('UPDATE id_get SET frequency = ? WHERE id = ?', [frequency + 1, id], (err, results) => {
                    if (err) {
                        console.error('Error updating frequency in id_get table:', err);
                        connection.end(); // 关闭数据库连接
                        return;
                    }
                });
                getDataFromMyTable(id); // 根据id获取data值
            }
            
            // 判断id_get表中的id值和my_table中的最后一行的id是否相等
            connection.query('SELECT id FROM my_table ORDER BY id DESC LIMIT 1', (err, results) => {
                if (err) {
                    console.error('Error fetching id from my_table:', err);
                    connection.end(); // 关闭数据库连接
                    return;
                }
                const lastId = results[0].id; // 获取my_table的最后一行id值
                if (id === lastId) {
                    // 将id_get表中的id值设为1
                    connection.query('UPDATE id_get SET id = 1', (err, results) => {
                        if (err) {
                            console.error('Error updating id in id_get table:', err);
                            connection.end(); // 关闭数据库连接
                            return;
                        }
                        console.log('id in id_get table has been reset to 1.');
                    });
                }
            });
        });
    });
});
// 根据id获取my_table表中的data
function getDataFromMyTable(id) {
    connection.query('SELECT data FROM my_table WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error('Error fetching data from my_table:', err);
            connection.end(); // 关闭数据库连接
            return;
        }
        const data = results[0].data; // 获取data值
        console.log('Data:', data);
        connection.end(); // 关闭数据库连接
    });
}