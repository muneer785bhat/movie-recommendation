from flask import Flask, render_template, request
from recommender import recommend, movies
from dotenv import load_dotenv
import os
import requests


# =========================
# LOAD ENVIRONMENT
# =========================

load_dotenv()


# =========================
# FLASK APP
# =========================

app = Flask(__name__)


# =========================
# TMDB CONFIG
# =========================

TMDB_API_KEY = os.getenv("TMDB_API_KEY")

TMDB_SEARCH_URL = (
    "https://api.themoviedb.org/3/search/movie"
)

TMDB_TRENDING_URL = (
    "https://api.themoviedb.org/3/trending/movie/week"
)


# =========================
# MOVIE ANALYTICS
# =========================

def get_movie_stats():

    # Total number of movies
    total_movies = len(movies)


    # Average rating
    average_rating = round(
        movies.loc[
            movies["vote_average"] > 0,
            "vote_average"
        ].mean(),
        2
    )


    # =========================
    # GENRE ANALYSIS
    # =========================

    genre_series = (
        movies["genre_list"]
        .explode()
        .dropna()
    )

    genre_counts = (
        genre_series
        .value_counts()
        .head(5)
    )

    top_genres = [
        {
            "name": genre,
            "count": int(count)
        }
        for genre, count
        in genre_counts.items()
    ]


    # =========================
    # POPULAR MOVIES
    # =========================

    popular_movies = (
        movies
        .sort_values(
            "popularity",
            ascending=False
        )
        .head(5)
    )

    top_movies = []

    for _, movie in popular_movies.iterrows():

        top_movies.append({

            "title": movie["title"],

            "rating": round(
                movie["vote_average"],
                1
            ),

            "popularity": round(
                movie["popularity"],
                1
            )

        })


    # =========================
    # RATING DISTRIBUTION
    # =========================

    rating_bins = [
        0,
        2,
        4,
        6,
        8,
        10
    ]

    rating_labels = [
        "0–2",
        "2–4",
        "4–6",
        "6–8",
        "8–10"
    ]

    rating_distribution = []

    for i in range(
        len(rating_labels)
    ):

        count = (
            (
                movies["vote_average"]
                >= rating_bins[i]
            )
            &
            (
                movies["vote_average"]
                < rating_bins[i + 1]
            )
        ).sum()

        rating_distribution.append({

            "label":
                rating_labels[i],

            "count":
                int(count)

        })


    # =========================
    # MOST POPULAR MOVIE
    # =========================

    most_popular_movie = (

        popular_movies.iloc[0]["title"]

        if not popular_movies.empty

        else "N/A"

    )


    # =========================
    # RETURN ANALYTICS
    # =========================

    return {

        "total_movies":
            total_movies,

        "average_rating":
            average_rating,

        "most_popular_movie":
            most_popular_movie,

        "top_genres":
            top_genres,

        "top_movies":
            top_movies,

        "rating_distribution":
            rating_distribution

    }


# =========================
# GET TRENDING MOVIES
# =========================

def get_trending_movies():

    params = {

        "api_key":
            TMDB_API_KEY

    }

    try:

        response = requests.get(

            TMDB_TRENDING_URL,

            params=params,

            timeout=10

        )


        if response.status_code != 200:

            return []


        results = response.json().get(

            "results",

            []

        )


        return results[:10]


    except requests.RequestException:

        return []


# =========================
# TRENDING MOVIES PAGE
# =========================

@app.route("/trending")
def trending_page():

    trending_movies = (
        get_trending_movies()
    )


    return render_template(

        "trending.html",

        trending_movies=
            trending_movies

    )


# =========================
# TMDB MOVIE SEARCH
# =========================

def get_tmdb_movie(title):

    params = {

        "api_key":
            TMDB_API_KEY,

        "query":
            title

    }


    try:

        response = requests.get(

            TMDB_SEARCH_URL,

            params=params,

            timeout=10

        )


        if response.status_code != 200:

            return None


        results = response.json().get(

            "results",

            []

        )


        if not results:

            return None


        movie = results[0]


        return {

            "id":
                movie.get("id"),

            "title":
                movie.get("title"),

            "overview":
                movie.get("overview"),

            "rating":
                movie.get(
                    "vote_average",
                    0
                ),

            "release_date":
                movie.get(
                    "release_date",
                    ""
                ),

            "poster_path":
                movie.get(
                    "poster_path"
                )

        }


    except requests.RequestException:

        return None


# =========================
# SEARCH AUTOCOMPLETE
# =========================

@app.route("/search")
def search_movies():

    query = request.args.get(

        "query",

        ""

    ).strip()


    if not query:

        return {

            "results": []

        }


    params = {

        "api_key":
            TMDB_API_KEY,

        "query":
            query

    }


    try:

        response = requests.get(

            TMDB_SEARCH_URL,

            params=params,

            timeout=10

        )


        if response.status_code != 200:

            return {

                "results": []

            }


        results = response.json().get(

            "results",

            []

        )


        movies_result = []


        for movie in results[:8]:

            movies_result.append({

                "title":
                    movie.get(
                        "title",
                        ""
                    ),

                "release_date":
                    movie.get(
                        "release_date",
                        ""
                    ),

                "poster_path":
                    movie.get(
                        "poster_path"
                    )

            })


        return {

            "results":
                movies_result

        }


    except requests.RequestException:

        return {

            "results": []

        }


# =========================
# HOME PAGE
# =========================

@app.route(
    "/",
    methods=[
        "GET",
        "POST"
    ]
)
def home():

    recommendations = []

    movie = ""


    # Trending movies
    trending_movies = (
        get_trending_movies()
    )


    # Analytics
    stats = get_movie_stats()


    # =========================
    # RECOMMENDATION
    # =========================

    if request.method == "POST":

        movie = request.form.get(

            "movie",

            ""

        ).strip()


        if movie:

            ml_recommendations = (
                recommend(
                    movie,
                    10
                )
            )


            for item in ml_recommendations:

                tmdb_movie = (
                    get_tmdb_movie(
                        item["title"]
                    )
                )


                if tmdb_movie:

                    # AI similarity
                    tmdb_movie["similarity"] = (
                        item["similarity"]
                    )


                    # Hybrid AI score
                    tmdb_movie["hybrid_score"] = (
                        item["hybrid_score"]
                    )


                    # Recommendation reason
                    tmdb_movie["reason"] = (
                        item.get(
                            "reason",
                            ""
                        )
                    )


                    # Genres
                    tmdb_movie["genres"] = (
                        item.get(
                            "genres",
                            ""
                        )
                    )


                    recommendations.append(
                        tmdb_movie
                    )


                else:

                    item["id"] = None

                    recommendations.append(
                        item
                    )


    # =========================
    # RENDER HOMEPAGE
    # =========================

    return render_template(

        "index.html",

        recommendations=
            recommendations,

        movie=
            movie,

        trending_movies=
            trending_movies,

        stats=
            stats

    )


# =========================
# MOVIE DETAILS
# =========================

@app.route(
    "/movie/<int:movie_id>"
)
def movie_details(movie_id):

    url = (

        "https://api.themoviedb.org/3/"
        f"movie/{movie_id}"

    )


    params = {

        "api_key":
            TMDB_API_KEY,

        "append_to_response":
            "credits,videos"

    }


    try:

        response = requests.get(

            url,

            params=params,

            timeout=10

        )


        if response.status_code != 200:

            return {

                "error":
                    "Movie not found"

            }, 404


        movie = response.json()


        return movie


    except requests.RequestException:

        return {

            "error":
                "TMDB request failed"

        }, 500


# =========================
# START SERVER
# =========================

if __name__ == "__main__":

    app.run(

        debug=True

    )