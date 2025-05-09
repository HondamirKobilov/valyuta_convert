# import psycopg2
# import openpyxl
# import csv
#
# # PostgreSQL bazasiga ulanish
# try:
#     conn = psycopg2.connect(
#         dbname="dtm_webApp",
#         user="postgres",
#         password="123",
#         host="localhost",
#         port="5432"
#     )
#     cursor = conn.cursor()
#     print("PostgreSQL bazasiga ulanish muvaffaqiyatli amalga oshdi!")
# except Exception as e:
#     print(f"Bazaga ulanishda xato: {e}")
#     exit()
#
# # Jadvallarni yaratish funksiyasi
# def create_tables():
#     try:
#         # Result jadvali
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS result (
#                 id SERIAL PRIMARY KEY,
#                 year INTEGER,
#                 direction_id VARCHAR(255),
#                 region_name VARCHAR(255) DEFAULT 'Nomalum',
#                 institute_name VARCHAR(255) DEFAULT 'Nomalum',
#                 direction_name VARCHAR(255) DEFAULT 'Nomalum',
#                 grand_kvota INTEGER DEFAULT 0,
#                 kontrakt_kvota INTEGER DEFAULT 0,
#                 grand_ball FLOAT DEFAULT 0,
#                 kontrakt_ball FLOAT DEFAULT 0,
#                 language VARCHAR(255) DEFAULT 'Uzbek',
#                 olimp INTEGER DEFAULT 0,
#                 etype VARCHAR(255) DEFAULT 'Kunduzgi'
#             );
#         """)
#         print("Result jadvali yaratildi (agar mavjud bo'lmasa).")
#
#         # Subjects jadvali
#         cursor.execute("""
#             CREATE TABLE IF NOT EXISTS subjects (
#                 id SERIAL PRIMARY KEY,
#                 fid VARCHAR(255),
#                 year INTEGER,
#                 fanlar VARCHAR(255),
#                 dir_name VARCHAR(255)
#             );
#         """)
#         print("Subjects jadvali yaratildi (agar mavjud bo'lmasa).")
#         conn.commit()
#     except Exception as e:
#         print(f"Jadvallarni yaratishda xato: {e}")
#         conn.rollback()
#
# # Excel ma'lumotlarini sanitizatsiya qilish
# def sanitize_value(value, expected_type, default=None):
#     try:
#         if expected_type == int:
#             return int(value)
#         elif expected_type == float:
#             return float(value)
#         elif expected_type == str:
#             return str(value).strip()
#         return value
#     except (ValueError, TypeError):
#         return default
#
# # Result jadvaliga Excel fayldan ma'lumotlarni yuklash
# def import_results(file_path):
#     try:
#         workbook = openpyxl.load_workbook(file_path)
#         sheet = workbook.active  # Asosiy varaqni tanlash
#
#         # Excel ustun nomlari
#         columns = [cell.value for cell in sheet[1]]
#
#         # Ustunlarni nomiga ko'ra tartibga solish
#         expected_columns = [
#             'year', 'direction_id', 'region_name', 'institute_name', 'direction_name',
#             'grand_kvota', 'kontrakt_kvota', 'grand_ball', 'kontrakt_ball', 'language',
#             'olimp', 'etype'
#         ]
#
#         column_indices = [columns.index(col) for col in expected_columns]
#
#         for row in sheet.iter_rows(min_row=2, values_only=True):
#             ordered_row = [row[i] for i in column_indices]
#             cursor.execute("""
#                 INSERT INTO result (year, direction_id, region_name, institute_name, direction_name,
#                                     grand_kvota, kontrakt_kvota, grand_ball, kontrakt_ball, language,
#                                     olimp, etype)
#                 VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
#             """, tuple(
#                 sanitize_value(ordered_row[i], int if i in [0, 5, 6, 10] else float if i in [7, 8] else str)
#                 for i in range(len(ordered_row))
#             ))
#         conn.commit()
#         print(f"{file_path} fayldan ma'lumotlar result jadvaliga yuklandi!")
#     except Exception as e:
#         print(f"Result jadvaliga yuklashda xato: {e}")
#         conn.rollback()
#
# # Subjects jadvaliga CSV fayldan ma'lumotlarni yuklash
# def import_subjects(file_path):
#     try:
#         with open(file_path, 'r', encoding='utf-8') as file:
#             csv_reader = csv.DictReader(file)
#             for row in csv_reader:
#                 cursor.execute("""
#                     INSERT INTO subjects (fid, year, fanlar, dir_name)
#                     VALUES (%s, %s, %s, %s)
#                 """, (
#                     row.get('fid', None),
#                     sanitize_value(row.get('year'), int, 0),
#                     row.get('fanlar', "Nomalum"),
#                     row.get('dir_name', "Nomalum")
#                 ))
#         conn.commit()
#         print(f"{file_path} fayldan ma'lumotlar subjects jadvaliga yuklandi!")
#     except Exception as e:
#         print(f"Subjects jadvaliga yuklashda xato: {e}")
#         conn.rollback()
#
# # Fayllar yo'li
# result_file_path = 'result.xlsx'
# subjects_file_path = 'subjects.csv'
#
# # Jadvallarni yaratish
# create_tables()
#
# # Ma'lumotlarni yuklash
# import_results(result_file_path)
# import_subjects(subjects_file_path)
#
# # Ulanishni yopish
# cursor.close()
# conn.close()
#
# print("Barcha ma'lumotlar bazaga muvaffaqiyatli yuklandi!")
