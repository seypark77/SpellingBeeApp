import json

with open('src/data/words.json', 'r', encoding='utf-8') as f:
    words = json.load(f)

for i in range(0, 450, 45):
    w = words[i]
    print(f"#{w['id']} {w['word']} ({w['partOfSpeech']}): {w['definition']}")
