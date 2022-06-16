import { async } from "regenerator-runtime";
import { API_URL, RES_PER_PAGE, KEY } from "./config.js";
import { AJAX } from "./helpers.js";
import bookmarksView from "./views/bookmarksView.js";

export const state = {
  recipe: {},
  search: {
    query: "",
    results: new Array(),
    page: 1,
    resultsPerPage: RES_PER_PAGE,
  },
  bookmarks: new Array(),
};

const createRecipeObj = function (data) {
  const { recipe } = data.data;
  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}${id}?key=${KEY}`);

    state.recipe = createRecipeObj(data);

    if (
      state.bookmarks.some(function (bookmark) {
        return bookmark.id === id;
      })
    ) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);

    state.search.results = data.data.recipes.map(function (recipe) {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,
        image: recipe.image_url,
        ...(recipe.key && { key: recipe.key }),
      };
    });
    state.search.page = 1; //To start again from the page one
  } catch (err) {
    console.error(err);
    throw err;
  }
};

//To avoid fill all the page with all the results (appear only 10 first in page 1)
export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * state.search.resultsPerPage; //etc 0
  const end = page * state.search.resultsPerPage; //etc 9

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings = 4) {
  state.recipe.ingredients.forEach(function (ing) {
    ing.quantity = (ing.quantity * newServings) / state.recipe.servings;
  });

  state.recipe.servings = newServings;
};

const persistBookmarks = function () {
  localStorage.setItem("bookmarks", JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  //Add bookmark
  state.bookmarks.push(recipe);
  //Mark curr recipe as bookmarked
  if (recipe.id === state.recipe.id) {
    state.recipe.bookmarked = true;
  }

  persistBookmarks();
};

export const deleteBookmark = function (id) {
  //Delete bookmark
  const index = state.bookmarks.findIndex(function (el) {
    return el.id === id;
  });
  state.bookmarks.splice(index, 1);

  //Mark curr recipe as NOT bookmarked
  if (id === state.recipe.id) {
    state.recipe.bookmarked = false;
  }

  persistBookmarks();
};

//Testing function
const clearBookmarks = function () {
  localStorage.clear("bookmarks");
};

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(function (entry) {
        return entry[0].startsWith("ingredient") && entry[1] !== "";
      })
      .map(function (ing) {
        const ingArr = ing[1].split(",").map((el) => el.trim());
        if (ingArr.length !== 3) {
          throw new Error("Wrong ingeredient format! Please use the corect format");
        }
        const [quantity, unit, description] = ingArr;
        return { quantity: quantity ? Number(quantity) : null, unit, description };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: Number(newRecipe.cookingTime),
      servings: Number(newRecipe.servings),
      ingredients,
    };

    const data = await AJAX(`${API_URL}?key=${KEY}`, recipe);
    state.recipe = createRecipeObj(data);
    //Add to the bookmarks
    addBookmark(state.recipe);
    //update the appeared bookmarks
    bookmarksView.render(state.bookmarks);
  } catch (err) {
    throw err;
  }
};

(function () {
  const storage = localStorage.getItem("bookmarks");

  if (storage) {
    state.bookmarks = JSON.parse(storage);
  }
})();
