import json

movie_path = "/home/deist/Downloads/Work/PGR_Data/EN/bytes/client/movie/movies/MovieHD03101BA.json"

with open(movie_path, "r", encoding="utf-8") as f:
    movie_data = json.load(f)

for node in movie_data:
    if node.get("Type") == 301:
        params_str = node.get("Params", "")
        if "21:" in params_str:
            print(params_str)
