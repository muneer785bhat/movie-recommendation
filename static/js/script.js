// =====================================================
// MOVIEAI - MAIN JAVASCRIPT
// =====================================================


// =====================================================
// GLOBAL SETTINGS
// =====================================================

const TMDB_IMAGE_BASE =
    "https://image.tmdb.org/t/p/w500";

const WATCHLIST_KEY =
    "movieai_watchlist";


// =====================================================
// DOM READY
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeMovieCards();

        initializeWatchlist();

        initializeModal();

        initializeSearch();

        updateWatchlistButtons();

    }
);


// =====================================================
// MOVIE CARD CLICK
// =====================================================

function initializeMovieCards() {

    document.addEventListener(
        "click",
        function (event) {

            // -----------------------------------------
            // IMPORTANT
            // If user clicked a watchlist button,
            // do NOT open movie details.
            // -----------------------------------------

            const watchlistButton =
                event.target.closest(".watchlist-btn");

            if (watchlistButton) {
                return;
            }


            // -----------------------------------------
            // Find movie card
            // -----------------------------------------

            const card =
                event.target.closest(".movie-card");


            if (!card) {
                return;
            }


            // -----------------------------------------
            // Get movie ID
            // -----------------------------------------

            const movieId =
                card.dataset.movieId;


            if (!movieId) {

                console.warn(
                    "Movie ID missing from movie card."
                );

                return;
            }


            // -----------------------------------------
            // Open movie details
            // -----------------------------------------

            showMovieDetails(movieId);

        }
    );

}


// =====================================================
// MOVIE DETAILS
// =====================================================

async function showMovieDetails(movieId) {

    const modal =
        document.getElementById(
            "movie-modal"
        );

    const details =
        document.getElementById(
            "movie-details"
        );


    if (!modal || !details) {

        console.error(
            "Movie modal elements not found."
        );

        return;
    }


    // -----------------------------------------
    // Open modal immediately
    // -----------------------------------------

    modal.classList.add("active");


    // -----------------------------------------
    // Loading message
    // -----------------------------------------

    details.innerHTML = `
        <div class="loading-details">

            <div class="loading-icon">
                🎬
            </div>

            <p>
                Loading movie details...
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                `/movie/${movieId}`
            );


        if (!response.ok) {

            throw new Error(
                `Request failed: ${response.status}`
            );

        }


        const movie =
            await response.json();


        renderMovieDetails(
            movie,
            details
        );

    }


    catch (error) {

        console.error(
            "Movie details error:",
            error
        );


        details.innerHTML = `

            <div class="loading-details">

                <h3>
                    😕 Unable to load movie details
                </h3>

                <p>
                    Please try again.
                </p>

            </div>

        `;

    }

}


// =====================================================
// RENDER MOVIE DETAILS
// =====================================================

function renderMovieDetails(
    movie,
    container
) {

    // -----------------------------------------
    // Poster
    // -----------------------------------------

    const poster =
        movie.poster_path
            ? `${TMDB_IMAGE_BASE}${movie.poster_path}`
            : "";


    // -----------------------------------------
    // Release year
    // -----------------------------------------

    const year =
        movie.release_date
            ? movie.release_date.substring(
                0,
                4
            )
            : "N/A";


    // -----------------------------------------
    // Genres
    // -----------------------------------------

    const genres =
        Array.isArray(movie.genres)
            ? movie.genres
                .map(
                    genre =>
                        genre.name
                )
                .join(", ")
            : "N/A";


    // -----------------------------------------
    // Runtime
    // -----------------------------------------

    const runtime =
        movie.runtime
            ? `${movie.runtime} min`
            : "N/A";


    // -----------------------------------------
    // Rating
    // -----------------------------------------

    const rating =
        typeof movie.vote_average === "number"
            ? movie.vote_average.toFixed(1)
            : "N/A";


    // -----------------------------------------
    // Budget
    // -----------------------------------------

    const budget =
        movie.budget
            ? `$${movie.budget.toLocaleString()}`
            : "N/A";


    // -----------------------------------------
    // Revenue
    // -----------------------------------------

    const revenue =
        movie.revenue
            ? `$${movie.revenue.toLocaleString()}`
            : "N/A";


    // =================================================
    // DIRECTOR
    // =================================================

    const director =
        movie.credits?.crew?.find(
            person =>
                person.job === "Director"
        );


    const directorName =
        director
            ? director.name
            : "N/A";


    // =================================================
    // WRITERS
    // =================================================

    const writers =
        movie.credits?.crew
            ?.filter(
                person =>
                    person.department ===
                    "Writing"
            )
            .slice(0, 4)
        || [];


    const writerNames =
        writers.length
            ? writers
                .map(
                    writer =>
                        writer.name
                )
                .join(", ")
            : "N/A";


    // =================================================
    // CAST
    // =================================================

    const cast =
        movie.credits?.cast
            ?.slice(0, 6)
        || [];


    let castHTML = "";


    if (cast.length) {

        castHTML =
            cast
                .map(
                    actor => {

                        const image =
                            actor.profile_path
                                ? `
                                    <img
                                        src="https://image.tmdb.org/t/p/w185${actor.profile_path}"
                                        alt="${escapeHTML(
                                            actor.name
                                        )}"
                                    >
                                `
                                : `
                                    <div class="cast-placeholder">
                                        👤
                                    </div>
                                `;


                        return `

                            <div class="cast-card">

                                ${image}

                                <strong>
                                    ${escapeHTML(
                                        actor.name
                                    )}
                                </strong>

                                <small>
                                    ${escapeHTML(
                                        actor.character || ""
                                    )}
                                </small>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    // =================================================
    // PRODUCTION
    // =================================================

    const companies =
        movie.production_companies
            ?.slice(0, 5)
            .map(
                company =>
                    company.name
            )
            .join(", ")
        || "N/A";


    // =================================================
    // TRAILER
    // =================================================

    const trailer =
        movie.videos?.results?.find(
            video =>
                video.site === "YouTube" &&
                video.type === "Trailer"
        );


    let trailerHTML = "";


    if (trailer) {

        trailerHTML = `

            <a
                href="https://www.youtube.com/watch?v=${encodeURIComponent(
                    trailer.key
                )}"
                target="_blank"
                rel="noopener noreferrer"
                class="trailer-button"
            >
                ▶ Watch Trailer
            </a>

        `;

    }


    // =================================================
    // POSTER HTML
    // =================================================

    const posterHTML =
        poster

            ? `
                <img
                    src="${poster}"
                    alt="${escapeHTML(
                        movie.title ||
                        "Movie"
                    )}"
                    class="details-poster"
                >
            `

            : `
                <div class="details-poster-placeholder">
                    🎬
                </div>
            `;


    // =================================================
    // FINAL DETAILS HTML
    // =================================================

    container.innerHTML = `

        <div class="details-layout">

            <div class="details-poster-wrapper">

                ${posterHTML}

            </div>


            <div class="details-info">

                <span class="details-label">
                    MOVIE DETAILS
                </span>


                <h2>
                    ${escapeHTML(
                        movie.title ||
                        "Unknown Movie"
                    )}
                </h2>


                ${
                    movie.tagline

                        ? `
                            <p class="details-tagline">
                                "${escapeHTML(
                                    movie.tagline
                                )}"
                            </p>
                          `

                        : ""
                }


                <div class="details-meta">

                    ⭐ ${rating}

                    <span>•</span>

                    ${year}

                    <span>•</span>

                    ${runtime}

                </div>


                <div class="details-genres">

                    ${escapeHTML(
                        genres
                    )}

                </div>


                <p class="details-overview">

                    ${escapeHTML(
                        movie.overview ||
                        "No overview available."
                    )}

                </p>


                <div class="crew-info">

                    <p>

                        <strong>
                            🎬 Director:
                        </strong>

                        ${escapeHTML(
                            directorName
                        )}

                    </p>


                    <p>

                        <strong>
                            ✍️ Writers:
                        </strong>

                        ${escapeHTML(
                            writerNames
                        )}

                    </p>


                    <p>

                        <strong>
                            🏢 Production:
                        </strong>

                        ${escapeHTML(
                            companies
                        )}

                    </p>

                </div>


                <div class="details-stats">

                    <div>

                        <span>
                            Rating
                        </span>

                        <strong>
                            ⭐ ${rating}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Budget
                        </span>

                        <strong>
                            ${budget}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Revenue
                        </span>

                        <strong>
                            ${revenue}
                        </strong>

                    </div>

                </div>


                ${
                    castHTML

                        ? `
                            <div class="cast-section">

                                <h3>
                                    🎭 Top Cast
                                </h3>

                                <div class="cast-grid">

                                    ${castHTML}

                                </div>

                            </div>
                          `

                        : ""
                }


                ${trailerHTML}

            </div>

        </div>

    `;

}


// =====================================================
// MODAL
// =====================================================

function initializeModal() {

    const modal =
        document.getElementById(
            "movie-modal"
        );


    const closeButton =
        document.getElementById(
            "close-modal"
        );


    if (!modal) {
        return;
    }


    // -----------------------------------------
    // Close button
    // -----------------------------------------

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            function () {

                closeMovieDetails();

            }
        );

    }


    // -----------------------------------------
    // Click outside modal
    // -----------------------------------------

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeMovieDetails();

            }

        }
    );


    // -----------------------------------------
    // Escape key
    // -----------------------------------------

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeMovieDetails();

            }

        }
    );

}


// =====================================================
// CLOSE MOVIE DETAILS
// =====================================================

function closeMovieDetails() {

    const modal =
        document.getElementById(
            "movie-modal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }

}


// =====================================================
// WATCHLIST
// =====================================================

function initializeWatchlist() {

    // -----------------------------------------
    // ONE GLOBAL CLICK HANDLER
    // -----------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            const button =
                event.target.closest(
                    ".watchlist-btn"
                );


            // Not a watchlist button
            if (!button) {
                return;
            }


            // -----------------------------------------
            // STOP movie-card click
            // -----------------------------------------

            event.preventDefault();
            event.stopPropagation();


            // -----------------------------------------
            // Get movie information
            // -----------------------------------------

            const movieId =
                button.getAttribute(
                    "data-movie-id"
                );


            const movieTitle =
                button.getAttribute(
                    "data-movie-title"
                ) ||
                "Unknown Movie";


            // -----------------------------------------
            // Check ID
            // -----------------------------------------

            if (!movieId) {

                console.error(
                    "WATCHLIST ERROR: Movie ID missing."
                );

                return;
            }


            // -----------------------------------------
            // Add / Remove
            // -----------------------------------------

            toggleWatchlist(
                movieId,
                movieTitle
            );

        }
    );


    // -----------------------------------------
    // Render saved watchlist
    // -----------------------------------------

    renderWatchlist();

}


// =====================================================
// TOGGLE WATCHLIST
// =====================================================

function toggleWatchlist(
    movieId,
    movieTitle
) {

    let watchlist =
        getWatchlist();


    // -----------------------------------------
    // Check if movie already exists
    // -----------------------------------------

    const existingIndex =
        watchlist.findIndex(
            movie =>
                String(movie.id) ===
                String(movieId)
        );


    // =================================================
    // REMOVE
    // =================================================

    if (existingIndex !== -1) {

        watchlist.splice(
            existingIndex,
            1
        );


        saveWatchlist(
            watchlist
        );


        updateWatchlistButtons();

        renderWatchlist();


        console.log(
            "Removed from watchlist:",
            movieTitle
        );


        return;
    }


    // =================================================
    // ADD
    // =================================================

    const movieObject = {

        id: String(movieId),

        title: movieTitle

    };


    watchlist.push(
        movieObject
    );


    saveWatchlist(
        watchlist
    );


    updateWatchlistButtons();

    renderWatchlist();


    console.log(
        "Added to watchlist:",
        movieTitle
    );

}


// =====================================================
// GET WATCHLIST
// =====================================================

function getWatchlist() {

    try {

        const saved =
            localStorage.getItem(
                WATCHLIST_KEY
            );


        if (!saved) {
            return [];
        }


        const parsed =
            JSON.parse(saved);


        if (
            Array.isArray(parsed)
        ) {

            return parsed;

        }


        return [];

    }


    catch (error) {

        console.error(
            "Watchlist read error:",
            error
        );


        return [];

    }

}


// =====================================================
// SAVE WATCHLIST
// =====================================================

function saveWatchlist(
    watchlist
) {

    try {

        localStorage.setItem(
            WATCHLIST_KEY,
            JSON.stringify(
                watchlist
            )
        );


    }

    catch (error) {

        console.error(
            "Watchlist save error:",
            error
        );

    }

}


// =====================================================
// REMOVE FROM WATCHLIST
// =====================================================

function removeFromWatchlist(
    movieId
) {

    const watchlist =
        getWatchlist().filter(
            movie =>
                String(movie.id) !==
                String(movieId)
        );


    saveWatchlist(
        watchlist
    );


    updateWatchlistButtons();

    renderWatchlist();

}


// =====================================================
// UPDATE WATCHLIST BUTTONS
// =====================================================

function updateWatchlistButtons() {

    const watchlist =
        getWatchlist();


    document
        .querySelectorAll(
            ".watchlist-btn"
        )
        .forEach(
            button => {

                // -----------------------------------------
                // Ignore dynamically generated remove buttons
                // -----------------------------------------

                if (
                    button.classList.contains(
                        "remove-watchlist"
                    )
                ) {

                    return;

                }


                const movieId =
                    button.getAttribute(
                        "data-movie-id"
                    );


                if (!movieId) {
                    return;
                }


                const exists =
                    watchlist.some(
                        movie =>
                            String(movie.id) ===
                            String(movieId)
                    );


                if (exists) {

                    button.innerHTML =
                        "♥ Added to Watchlist";

                    button.classList.add(
                        "added"
                    );

                }

                else {

                    button.innerHTML =
                        "♡ Add to Watchlist";

                    button.classList.remove(
                        "added"
                    );

                }

            }
        );

}


// =====================================================
// RENDER WATCHLIST
// =====================================================

function renderWatchlist() {

    const container =
        document.getElementById(
            "watchlist-container"
        );


    const emptyMessage =
        document.getElementById(
            "empty-watchlist"
        );


    // -----------------------------------------
    // Trending page may not have watchlist section
    // -----------------------------------------

    if (!container) {
        return;
    }


    const watchlist =
        getWatchlist();


    container.innerHTML = "";


    // =================================================
    // EMPTY WATCHLIST
    // =================================================

    if (
        watchlist.length === 0
    ) {

        if (emptyMessage) {

            emptyMessage.style.display =
                "block";

        }


        return;

    }


    // -----------------------------------------
    // Hide empty message
    // -----------------------------------------

    if (emptyMessage) {

        emptyMessage.style.display =
            "none";

    }


    // =================================================
    // CREATE WATCHLIST CARDS
    // =================================================

    watchlist.forEach(
        movie => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "movie-card";


            card.dataset.movieId =
                movie.id;


            card.innerHTML = `

                <div class="no-poster">
                    🎬
                </div>


                <div class="movie-info">

                    <h3>
                        ${escapeHTML(
                            movie.title
                        )}
                    </h3>

                    <p class="watchlist-label">
                        ❤️ Saved to Watchlist
                    </p>

                </div>


                <button
                    type="button"
                    class="watchlist-btn remove-watchlist"
                    data-movie-id="${escapeHTML(
                        movie.id
                    )}"
                    data-movie-title="${escapeHTML(
                        movie.title
                    )}"
                >
                    ♥ Remove
                </button>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// SEARCH AUTOCOMPLETE
// =====================================================

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "movie-search"
        );


    const searchResults =
        document.getElementById(
            "search-results"
        );


    if (
        !searchInput ||
        !searchResults
    ) {

        return;

    }


    let searchTimeout;


    searchInput.addEventListener(
        "input",
        function () {

            const query =
                searchInput.value.trim();


            clearTimeout(
                searchTimeout
            );


            if (
                query.length < 2
            ) {

                searchResults.innerHTML =
                    "";

                return;

            }


            searchTimeout =
                setTimeout(
                    async function () {

                        try {

                            const response =
                                await fetch(
                                    `/search?query=${encodeURIComponent(
                                        query
                                    )}`
                                );


                            if (
                                !response.ok
                            ) {

                                return;

                            }


                            const data =
                                await response.json();


                            searchResults.innerHTML =
                                "";


                            if (
                                !data.results ||
                                data.results.length === 0
                            ) {

                                return;

                            }


                            data.results.forEach(
                                movie => {

                                    const item =
                                        document.createElement(
                                            "div"
                                        );


                                    item.className =
                                        "search-result-item";


                                    item.innerHTML = `

                                        ${
                                            movie.poster_path

                                                ? `
                                                    <img
                                                        src="https://image.tmdb.org/t/p/w92${movie.poster_path}"
                                                        alt="${escapeHTML(
                                                            movie.title
                                                        )}"
                                                    >
                                                  `

                                                : `
                                                    <div class="search-placeholder">
                                                        🎬
                                                    </div>
                                                  `
                                        }


                                        <div class="search-result-info">

                                            <strong>
                                                ${escapeHTML(
                                                    movie.title
                                                )}
                                            </strong>

                                            <small>

                                                ${
                                                    movie.release_date
                                                        ? movie.release_date.substring(
                                                            0,
                                                            4
                                                        )
                                                        : ""
                                                }

                                            </small>

                                        </div>

                                    `;


                                    item.addEventListener(
                                        "click",
                                        function () {

                                            searchInput.value =
                                                movie.title;

                                            searchResults.innerHTML =
                                                "";

                                        }
                                    );


                                    searchResults.appendChild(
                                        item
                                    );

                                }
                            );

                        }


                        catch (error) {

                            console.error(
                                "Search error:",
                                error
                            );

                        }

                    },
                    300
                );

        }
    );


    // -----------------------------------------
    // Close search results
    // -----------------------------------------

    document.addEventListener(
        "click",
        function (event) {

            if (
                !event.target.closest(
                    ".search-container"
                )
            ) {

                searchResults.innerHTML =
                    "";

            }

        }
    );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}