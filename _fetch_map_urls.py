import urllib.request
import json
import urllib.parse

def thumb(url: str) -> str:
    path = url.replace("https://mario.wiki.gallery/images/", "")
    filename = path.split("/")[-1]
    return f"https://mario.wiki.gallery/images/thumb/{path}/270px-{filename}"

mapping = {
    "Mario Bros. Circuit": "MKWd_Mario_Bros_Circuit_Icon.png",
    "Whistlestop Summit": "MKWd_Whistlestop_Summit_Icon.png",
    "DK Spaceport": "MKWd_DK_Spaceport_Icon.png",
    "Desert Hills": "MKWd_Desert_Hills_Icon.png",
    "Shy Guy Bazaar": "MKWd_Shy_Guy_Bazaar_Icon.png",
    "Wario Stadium": "MKWd_Wario_Stadium_Icon.png",
    "Airship Fortress": "MKWd_Airship_Fortress_Icon.png",
    "DK Pass": "MKWd_DK_Pass_Icon.png",
    "Starview Peak": "MKWd_Starview_Peak_Icon.png",
    "Salty Salty Speedway": "MKWorld_Icon_Salty_Salty_Speedway.png",
    "Peach Stadium": "MKWd_Peach_Stadium_Icon.png",
    "Chain Chomp Desert": "MKWorld_Battle_Chain_Chomp_Desert.png",
    "Dino Dino Jungle": "MKWorld_Icon_Dino_Dino_Jungle.png",
    "Big Donut": "MKWorld_Battle_Big_Donut.png",
    "Koopa Troopa Beach": "MKWd_Koopa_Troopa_Beach_Icon.png",
    "Ghost Valley 1": "MKWorld_Acorn_Heights_Icon.png",
    "Choco Island 1": "MKWd_Koopa_Troopa_Beach_Icon.png",
    "Ghost Valley 2": "MKWd_Faraway_Oasis_Icon.png",
    "Koopa Beach 1": "MKWd_Crown_City_2_Icon.png",
    "Choco Island 2": "MKWd_Peach_Stadium_Icon.png",
    "Vanilla Lake 1": "MKWorld_Icon_Peach_Beach.png",
    "Ghost Valley 3": "MKWorld_Icon_Salty_Salty_Speedway.png",
    "TBD Course 22": "MKWorld_Icon_Dino_Dino_Jungle.png",
    "TBD Course 23": "MKWorld_Question_Ruins_icon.png",
    "TBD Course 24": "MKWorld_Cheep_Cheep_Falls_icon.png",
    "TBD Course 25": "MKWorld_Dandelion_Depths_icon.png",
    "TBD Course 26": "MKWorld_Boo_Cinema_icon.png",
    "TBD Course 27": "MKWorld_Dry_Bones_Burnout_icon.png",
    "TBD Course 28": "MKWorld_Moo_Moo_Meadows_icon.png",
    "TBD Course 29": "MKWorld_Choco_Mountain_icon.png",
    "TBD Course 30": "MKWorld_Toads_Factory_icon.png",
    "TBD Course 31": "MKWorld_Bowsers_Castle_icon.png",
}

files = list(set(mapping.values()))
titles = "|".join("File:" + f for f in files)
url = (
    "https://www.mariowiki.com/api.php?action=query&format=json"
    "&prop=imageinfo&iiprop=url&titles=" + urllib.parse.quote(titles, safe="|")
)
with urllib.request.urlopen(url) as response:
    data = json.load(response)

file_urls = {}
for page in data["query"]["pages"].values():
    if "imageinfo" in page:
        name = page["title"].replace("File:", "").replace(" ", "_")
        file_urls[name] = thumb(page["imageinfo"][0]["url"])

for name, file in mapping.items():
    print(f"{name!r}: {file_urls.get(file, '?')}")
