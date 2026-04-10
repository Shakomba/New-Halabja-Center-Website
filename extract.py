import google.generativeai as genai
import os

genai.configure(api_key=os.environ.get('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-2.5-flash')

for i in range(1, 5):
    print(f'--- POST {i} ---')
    sample_file = genai.upload_file(path=f'assets/img/activities/post{i}.png')
    response = model.generate_content(['Extract all the text in this image verbatim. Do not translate. Keep the original language (Kurdish/Arabic).', sample_file])
    print(response.text)
