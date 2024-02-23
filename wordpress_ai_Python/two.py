import requests
import random
import base64
import pymysql.cursors

def get_database_connection():
    return pymysql.connect(host='127.0.0.1',
                          user='root',
                          password='mysql_NBByjs',
                          database='text',
                          cursorclass=pymysql.cursors.DictCursor)

def update_id_frequency(cursor, id, frequency):
    if frequency == 10:
        cursor.execute('UPDATE id_get SET id = id + 1, frequency = 0')
    else:
        cursor.execute('UPDATE id_get SET frequency = %s WHERE id = %s', (frequency + 1, id))

def get_data_by_id(cursor, id):
    cursor.execute('SELECT data FROM my_table WHERE id = %s', (id,))
    return cursor.fetchone()['data']

def reset_id(cursor):
    cursor.execute('UPDATE id_get SET id = 1')

def main_mysql():
    connection = get_database_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT id, frequency FROM id_get')
            results = cursor.fetchall()

            for row in results:
                id = row['id']
                frequency = row['frequency']

                update_id_frequency(cursor, id, frequency)

                data = get_data_by_id(cursor, id)
                print('Data:', data)

                cursor.execute('SELECT id FROM my_table ORDER BY id DESC LIMIT 1')
                last_id = cursor.fetchone()['id']
                if id == last_id:
                    reset_id(cursor)
                    print('id in id_get table has been reset to 1.')

        connection.commit()

    except Exception as e:
        print('Error:', e)

    finally:
        connection.close()

    return data

def get_categories():
    try:
        response = requests.get('https://www.yunche168.cn/wp-json/wp/v2/categories')
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print("Error:", e)
        return None

def create_wordpress_post(title, content, category_id, description, keywords):
    try:
        wp_api_url = 'https://www.yunche168.cn/wp-json'
        username = 'keng'
        password = 'O7g6Ht3ddeTK1DN9rv500mwz'
        token = base64.b64encode(f"{username}:{password}".encode()).decode()

        post_data = {
            'title': title,
            'content': content,
            'categories': [category_id],
            'status': 'publish',
            'meta': {
                '_yoast_wpseo_title': title,
                '_yoast_wpseo_metadesc': description,
                '_yoast_wpseo_focuskw': keywords
            }
        }

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

if __name__ == "__main__":
    adder_value = main_mysql()
    print('Adder value:', adder_value)

    if adder_value:
        categories = get_categories()
        if categories:
            random_category = random.choice(categories)['id']

            response_article = f"写一篇关于{adder_value}的文章,要求：扩展性可以较高,随机组词，不需要特殊符号,1000字左右"
            response_title = f"写一条关于{adder_value}的标题,要求：扩展性可以较高,随机组词，标题中不要带特殊符号"
            response_description = f"写一篇关于{adder_value}的描述,要求：扩展性可以较高,随机组词，100字左右，不需要特殊符号"
            response_keywords = f"写8个关于{adder_value}的关键词,要求：扩展性可以较高,随机组词，不需要特殊符号"

            create_wordpress_post(response_title, response_article, random_category, response_description, response_keywords)
