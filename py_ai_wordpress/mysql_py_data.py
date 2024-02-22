import mysql.connector

def create_tables():
    try:
        # 连接 MySQL 数据库
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='mysql_NBByjs',
            database='text'
        )
        # 创建游标对象
        cursor = conn.cursor()

        # 创建 'my_table'
        create_my_table_query = """
        CREATE TABLE IF NOT EXISTS my_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            data VARCHAR(255)
        ) CHARACTER SET=utf8mb4
        """
        cursor.execute(create_my_table_query)

        # 创建 'id_get'
        create_id_get_table_query = """
        CREATE TABLE IF NOT EXISTS id_get (
            id INT DEFAULT 1,
            frequency INT DEFAULT 1
        ) CHARACTER SET=utf8mb4
        """
        cursor.execute(create_id_get_table_query)

        # 插入 'id_get' 表的默认行
        insert_default_id_get_query = "INSERT INTO id_get (id, frequency) VALUES (1, 1)"
        cursor.execute(insert_default_id_get_query)

        # 提交更改并关闭连接
        conn.commit()
        cursor.close()
        conn.close()

        print("表格创建成功")

    except mysql.connector.Error as err:
        print(f"MySQL 错误: {err}")

def write_data_to_mysql(file_path):
    try:
        # 连接 MySQL 数据库
        conn = mysql.connector.connect(
            host='127.0.0.1',
            user='root',
            password='mysql_NBByjs',
            database='text'
        )
        # 创建游标对象
        cursor = conn.cursor()

        # 如果表格不存在，则创建
        create_tables()

        # 从文本文件读取数据并插入到 'my_table' 表中
        with open(file_path, 'r') as file:
            lines = file.readlines()
            total_lines = len(lines)

            for index, line in enumerate(lines):
                line = line.strip()
                if line:
                    insert_query = "INSERT INTO my_table (data) VALUES (%s)"
                    cursor.execute(insert_query, (line,))
                    conn.commit()

                    # 显示进度
                    progress = (index + 1) / total_lines * 100
                    print(f"进度: {progress:.2f}%\r", end='', flush=True)

        print("\n数据写入成功")

        # 关闭游标和数据库连接
        cursor.close()
        conn.close()

    except mysql.connector.Error as err:
        print(f"MySQL 错误: {err}")

# 调用函数，传入文本文件路径
write_data_to_mysql("./adder.txt")
