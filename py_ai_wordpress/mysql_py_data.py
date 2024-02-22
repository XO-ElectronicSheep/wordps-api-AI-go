import mysql.connector

def write_data_to_mysql(file_path):
    try:
        # 连接 MySQL 数据库
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='mysql_jnDyzw',
            database='text'
        )
        # 创建游标对象
        cursor = conn.cursor()
        # 创建表格
        create_table_query = """
        CREATE TABLE IF NOT EXISTS my_table (
        id INT AUTO_INCREMENT PRIMARY KEY,
        data VARCHAR(255)
        ) CHARACTER SET=utf8mb4
        """
        cursor.execute(create_table_query)
        # 读取文本文件并将数据写入数据库
        with open(file_path, 'r') as file:
            for line in file:
                line = line.strip()
                if line:
                    insert_query = "INSERT INTO my_table (data) VALUES (%s)"
                    cursor.execute(insert_query, (line,))
                    conn.commit()

        # 关闭游标和数据库连接
        cursor.close()
        conn.close()
        print("数据写入成功")
    except mysql.connector.Error as err:
        print(f"MySQL 错误: {err}")

# 调用函数，传入文本文件路径
write_data_to_mysql("./adder.txt")