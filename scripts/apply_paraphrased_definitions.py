import json
from paraphrases_1_to_150 import ONE_BEE_PARAPHRASES
from paraphrases_151_to_300 import TWO_BEE_PARAPHRASES
from paraphrases_301_to_450 import THREE_BEE_PARAPHRASES

all_paraphrases = {}
all_paraphrases.update(ONE_BEE_PARAPHRASES)
all_paraphrases.update(TWO_BEE_PARAPHRASES)
all_paraphrases.update(THREE_BEE_PARAPHRASES)

print(f"Total paraphrased definitions defined: {len(all_paraphrases)}")

# Verify all IDs from 1 to 450 are covered
missing = [i for i in range(1, 451) if i not in all_paraphrases]
if missing:
    print(f"ERROR: Missing definitions for IDs: {missing}")
    exit(1)

words_path = "src/data/words.json"
with open(words_path, "r", encoding="utf-8") as f:
    words = json.load(f)

for w in words:
    wid = w["id"]
    # Preserve original official Merriam-Webster / Scripps definition in officialDefinition
    if "officialDefinition" not in w:
        w["officialDefinition"] = w["definition"]
    # Replace definition with the new clean, copyright-safe, student-friendly paraphrase
    w["definition"] = all_paraphrases[wid]

with open(words_path, "w", encoding="utf-8") as f:
    json.dump(words, f, indent=2, ensure_ascii=False)

print("Successfully updated src/data/words.json!")
print("Sample #1:", words[0]["word"], "=>", words[0]["definition"])
print("Official #1:", words[0]["officialDefinition"])
print("Sample #450:", words[449]["word"], "=>", words[449]["definition"])
print("Official #450:", words[449]["officialDefinition"])
