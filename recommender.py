import pandas as pd
from ast import literal_eval
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# =========================
# 1. LOAD DATASET
# =========================

movies = pd.read_csv(
    "data/movies.csv",
    low_memory=False
)


# =========================
# 2. SELECT USEFUL COLUMNS
# =========================

movies = movies[
    [
        "title",
        "overview",
        "genres",
        "tagline",
        "release_date",
        "vote_average",
        "vote_count",
        "popularity",
        "poster_path"
    ]
].copy()


# Remove movies without titles
movies.dropna(
    subset=["title"],
    inplace=True
)

movies["title"] = (
    movies["title"]
    .astype(str)
    .str.strip()
)


# =========================
# 3. CLEAN GENRES
# =========================

def get_genres(value):

    try:

        genres = literal_eval(value)

        return " ".join(
            genre["name"]
            for genre in genres
        )

    except:

        return ""


# Keep original genre names for analytics
movies["genre_list"] = movies["genres"].apply(
    lambda value: [
        genre["name"]
        for genre in literal_eval(value)
    ] if isinstance(value, str) and value.startswith("[")
    else []
)

# Create text version for TF-IDF
movies["genres"] = movies["genre_list"].apply(
    lambda genres: " ".join(genres)
)


# =========================
# 4. HANDLE MISSING VALUES
# =========================

movies["vote_average"] = pd.to_numeric(
    movies["vote_average"],
    errors="coerce"
).fillna(0)

movies["vote_count"] = pd.to_numeric(
    movies["vote_count"],
    errors="coerce"
).fillna(0)

movies["popularity"] = pd.to_numeric(
    movies["popularity"],
    errors="coerce"
).fillna(0)


movies["overview"] = (
    movies["overview"]
    .fillna("")
    .astype(str)
)

movies["genres"] = (
    movies["genres"]
    .fillna("")
    .astype(str)
)

movies["tagline"] = (
    movies["tagline"]
    .fillna("")
    .astype(str)
)


# =========================
# 5. CREATE FEATURES
# =========================

movies["features"] = (
    movies["overview"] + " " +
    movies["genres"] + " " +
    movies["tagline"]
)


# =========================
# 6. TF-IDF
# =========================

tfidf = TfidfVectorizer(
    stop_words="english",
    max_features=30000
)

tfidf_matrix = tfidf.fit_transform(
    movies["features"]
)


# =========================
# 7. MOVIE INDEX
# =========================

indices = pd.Series(
    movies.index,
    index=movies["title"].str.lower()
).drop_duplicates()


# =========================
# 8. WEIGHTED RATING
# =========================

# Minimum number of votes required
# to give a movie strong rating influence

C = movies["vote_average"].mean()

m = movies["vote_count"].quantile(0.70)


movies["weighted_rating"] = (

    (movies["vote_count"] /
     (movies["vote_count"] + m))
    * movies["vote_average"]

    +

    (m /
     (movies["vote_count"] + m))
    * C

)


# =========================
# 9. NORMALIZE WEIGHTED RATING
# =========================

max_weighted_rating = (
    movies["weighted_rating"].max()
)

if max_weighted_rating > 0:

    rating_scores = (
        movies["weighted_rating"] /
        max_weighted_rating
    )

else:

    rating_scores = 0


# =========================
# 10. NORMALIZE POPULARITY
# =========================

max_popularity = (
    movies["popularity"].max()
)

if max_popularity > 0:

    popularity_scores = (
        movies["popularity"] /
        max_popularity
    )

else:

    popularity_scores = 0


# =========================
# 11. RECOMMENDATION FUNCTION
# =========================

def recommend(
    movie_title,
    number_of_recommendations=10
):

    movie_title = movie_title.lower().strip()


    # Check movie exists

    if movie_title not in indices:

        return []


    movie_index = indices[movie_title]


    # =========================
    # CONTENT SIMILARITY
    # =========================

    similarity_scores = cosine_similarity(

        tfidf_matrix[movie_index],

        tfidf_matrix

    ).flatten()


    # =========================
    # HYBRID SCORE
    # =========================

    hybrid_scores = (

        0.70 * similarity_scores

        +

        0.20 * rating_scores

        +

        0.10 * popularity_scores

    )


    # =========================
    # GET TOP RESULTS
    # =========================

    similar_indices = (
        hybrid_scores
        .argsort()[
            -number_of_recommendations - 1:
        ][::-1]
    )


    # Remove selected movie

    similar_indices = [

        i

        for i in similar_indices

        if i != movie_index

    ]


    similar_indices = (
        similar_indices[
            :number_of_recommendations
        ]
    )


    # =========================
    # CREATE RESULTS
    # =========================

    results = []


    # Genres of selected movie

    selected_genres = set(
        movies.iloc[movie_index]["genres"]
        .lower()
        .split()
    )


    for i in similar_indices:

        movie = movies.iloc[i]


        # =========================
        # FIND SHARED GENRES
        # =========================

        recommended_genres = set(
            movie["genres"]
            .lower()
            .split()
        )


        shared_genres = (
            selected_genres
            .intersection(
                recommended_genres
            )
        )


        if shared_genres:

            reason = (
                "Similar genres: "
                + ", ".join(
                    genre.title()
                    for genre in shared_genres
                )
            )

        else:

            reason = (
                "Similar story and themes"
            )


        # =========================
        # RESULT
        # =========================

        results.append({

            "title": movie["title"],

            "overview": movie["overview"],

            "genres": movie["genres"],

            "release_date": movie["release_date"],

            "rating": movie["vote_average"],

            "vote_count": movie["vote_count"],

            "popularity": movie["popularity"],

            "poster_path": movie["poster_path"],

            "similarity": round(
                similarity_scores[i] * 100,
                2
            ),

            "hybrid_score": round(
                hybrid_scores[i] * 100,
                2
            ),

            "weighted_rating": round(
                movie["weighted_rating"],
                2
            ),

            "reason": reason

        })


    return results


# =========================
# 12. TEST
# =========================

if __name__ == "__main__":

    movie = "Toy Story"

    recommendations = recommend(
        movie,
        10
    )


    print(
        "\nRecommendations for:",
        movie
    )


    for number, movie in enumerate(
        recommendations,
        1
    ):

        print(

            f"{number}. "
            f"{movie['title']} | "
            f"Rating: {movie['rating']} | "
            f"Similarity: {movie['similarity']}% | "
            f"AI Score: {movie['hybrid_score']}% | "
            f"Reason: {movie['reason']}"

        )