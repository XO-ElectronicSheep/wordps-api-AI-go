from openai import OpenAI
import mysql.connector
import requests
import random
import re
import base64
import pymysql.cursors

def main_mysql():
    # Connect to the database
    connection = pymysql.connect(host='127.0.0.1',
                                 user='root',
                                 password='mysql_NBByjs',
                                 database='text',
                                 cursorclass=pymysql.cursors.DictCursor)

    try:
        with connection.cursor() as cursor:
            # Fetch ids and frequencies from id_get table
            sql = 'SELECT id, frequency FROM id_get'
            cursor.execute(sql)
            results = cursor.fetchall()

            for row in results:
                id = row['id']
                frequency = row['frequency']

                # Check if id and frequency need to be updated
                if frequency == 10:
                    # Update id and frequency in id_get table
                    sql = 'UPDATE id_get SET id = id + 1, frequency = 0'
                    cursor.execute(sql)
                    connection.commit()
                    print('id and frequency in id_get table have been updated.')

                else:
                    # Update frequency in id_get table
                    sql = 'UPDATE id_get SET frequency = %s WHERE id = %s'
                    cursor.execute(sql, (frequency + 1, id))
                    connection.commit()

                # Get data value from my_table and assign it to adder
                sql = 'SELECT data FROM my_table WHERE id = %s'
                cursor.execute(sql, (id,))
                data = cursor.fetchone()['data']
                adder = data
                print('Data:', adder)

                # Check if id in id_get table matches the last id in my_table
                sql = 'SELECT id FROM my_table ORDER BY id DESC LIMIT 1'
                cursor.execute(sql)
                last_id = cursor.fetchone()['id']
                if id == last_id:
                    # Reset id in id_get table
                    sql = 'UPDATE id_get SET id = 1'
                    cursor.execute(sql)
                    connection.commit()
                    print('id in id_get table has been reset to 1.')

    except Exception as e:
        print('Error:', e)

    finally:
        # Close the database connection after all operations
        connection.close()

    return adder

# Run the MySQL function immediately to get the adder value
adder_value = main_mysql()
print('Adder value:', adder_value)


def get_chat_completion(api_key, base_url, model, user_message):
    try:
        client = OpenAI(api_key=api_key, base_url=base_url)
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": user_message}],
            temperature=0.9
        )
        return completion.choices[0].message.content
    except Exception as e:
        print("Error:", e)
        return None

# 调用函数并打印结果
api_key = "sk-abG3QEPU7TvqafIoA73c208d45744c8d8cE2Bc25A61bAcDa"
api_base = "https://gpt.mnxcc.com/v1"
model = "gpt-3.5-turbo"

# Check if adder_value is obtained before using it
if adder_value:
    response_article = get_chat_completion(api_key, api_base, model, f"写一篇关于{adder_value}的文章,要求：扩展性可以较高,随机组词，不需要特殊符号,1000字左右")
    response_title = get_chat_completion(api_key, api_base, model, f"写一条关于{adder_value}的标题,要求：扩展性可以较高,随机组词，标题中不要带特殊符号")
    response_description = get_chat_completion(api_key, api_base, model, f"写一篇关于{adder_value}的描述,要求：扩展性可以较高,随机组词，100字左右，不需要特殊符号")
    response_keywords = get_chat_completion(api_key, api_base, model, f"写8个关于{adder_value}的关键词,要求：扩展性可以较高,随机组词，不需要特殊符号")
    replacements = {
        "首先": "",
        "一旦": "",
        "最后": "",
        "此外": "",
        "当然": "",
        "所以": "",
        "接下来": '',
        "总之": '',
        "总结":'',
        "最终": '',
        "其次": '',
        "另外": '',
        "综上所述": '',
        "总的来说": ''
    }
    # 遍历字典，依次替换关键字
    for keyword, replacement in replacements.items():
        response_article = response_article.replace(keyword, replacement)

    additional_text = " [wpforms id='96'] "
    modified_string = "{}{}".format(response_article, additional_text)

    if response_article:
        print("文章:", modified_string)

    if response_title:
        print("标题:", response_title)

    if response_description:
        print("描述:", response_description)

    # 获取分类目录
    def get_categories():
        try:
            response = requests.get('https://www.yunche168.cn/wp-json/wp/v2/categories')
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print("Error:", e)
            return None

    # 主函数
    def main():
        try:

            # 你的 WordPress 网站信息
            wp_api_url = 'https://www.yunche168.cn/wp-json'
            username = 'keng'
            password = 'O7g6Ht3ddeTK1DN9rv500mwz'
            token = base64.b64encode(f"{username}:{password}".encode()).decode()

            # 获取分类目录
            categories = get_categories()
            if categories:
                random_category = random.choice(categories)['id']

                # wordpress 文章数据
                post_data = {
                    'title': response_title,
                    'content': modified_string,
                    'categories': [random_category],
                    'status': 'publish',
                    'meta': {
                        '_yoast_wpseo_title': response_title,
                        '_yoast_wpseo_metadesc': response_description,
                        '_yoast_wpseo_focuskw': response_keywords
                    }
                }

                # 创建文章
                response = requests.post(
                    f"{wp_api_url}/wp/v2/posts",
                    headers={
                        'Authorization': f'Basic {token}',
                        'Content-Type': 'application/json'
                    },
                    json=post_data
                )
                response.raise_for_status()
                print('文章创建成功', response.json())
                return 1
        except Exception as e:
            print("Error:", e)
            return 2

    # 执行主函数
    if __name__ == "__main__":
        main()
