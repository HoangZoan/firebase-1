import { useEffect, useState } from "react";
import "./App.css";
import FirebaseAuthService from "./FirebaseAuthService";
import FirebaseFirestoreService from "./FirebaseFirestoreService";
// import FirebaseFirestoreRestService from "./FirebaseFirestoreRestService";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";
import { Fragment } from "react/cjs/react.production.min";

function App() {
  const [user, setUser] = useState(null);
  const [currentRecipe, setCurrentRepice] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [orderBy, setOrderBy] = useState("publishDateDesc");
  const [recipesPerPage, setRecipesPerPage] = useState(3);
  // const [isLastPage, setIsLastPage] = useState(false);
  // const [totalNumberOfPages, setTotalNumberOfPages] = useState(0);
  // const [currentPageNumber, setCurrentPageNumber] = useState(1);

  const handleRecipesPerPageChange = (event) => {
    const recipesPerPageOnSelect = event.target.value;

    setRecipes([]);
    setRecipesPerPage(recipesPerPageOnSelect);
  };

  const handleLoadMoreRecipesClick = () => {
    const lastRecipe = recipes[recipes.length - 1];
    const cursorId = lastRecipe.id;

    handleFetchRecipes(cursorId);
  };

  const fetchRecipes = async (cursorId = "") => {
    const queries = [];

    if (categoryFilter) {
      queries.push({
        field: "category",
        condition: "==",
        value: categoryFilter,
      });
    }

    if (!user) {
      queries.push({
        field: "isPublished",
        condition: "==",
        value: true,
      });
    }

    const orderByField = "publishDate";
    let orderByDirection;

    if (orderBy) {
      switch (orderBy) {
        case "publishDateAsc":
          orderByDirection = "asc";
          break;
        case "publishDateDesc":
          orderByDirection = "desc";
          break;
        default:
          break;
      }
    }

    let fetchedRecipes = [];

    try {
      const response = await FirebaseFirestoreService.readDocuments({
        collection: "recipes",
        queries,
        orderByField,
        orderByDirection,
        perPage: recipesPerPage,
        cursorId,
      });
      const newRecipes = response.docs.map((recipeDoc) => {
        const id = recipeDoc.id;
        const data = recipeDoc.data();
        data.publishDate = new Date(data.publishDate.seconds * 1000);
        return { ...data, id };
      });
      if (cursorId) {
        fetchedRecipes = [...recipes, ...newRecipes];
      } else {
        fetchedRecipes = [...newRecipes];
      }

      // const response = await FirebaseFirestoreRestService.readDocuments({
      //   collection: "recipes",
      //   queries,
      //   orderByField,
      //   orderByDirection,
      //   perPage: recipesPerPage,
      //   pageNumber: currentPageNumber,
      // });

      // if (response && response.documents) {
      //   const totalNumberOfPages = Math.ceil(
      //     response.recipeCount / recipesPerPage
      //   );

      //   setTotalNumberOfPages(totalNumberOfPages);

      //   const nextPageQuery = {
      //     collection: "recipes",
      //     queries,
      //     orderByField,
      //     orderByDirection,
      //     perPage: recipesPerPage,
      //     pageNumber: currentPageNumber + 1,
      //   };

      //   const nextPageResponse = await FirebaseFirestoreService.readDocuments(
      //     nextPageQuery
      //   );

      //   if (
      //     nextPageResponse &&
      //     nextPageResponse.documents &&
      //     nextPageResponse.documents.length === 0
      //   ) {
      //     setIsLastPage(true);
      //   } else {
      //     setIsLastPage(false);
      //   }

      //   if (response.documents.length === 0 && currentPageNumber !== 1) {
      //     setCurrentPageNumber(currentPageNumber - 1);
      //   }

      //   fetchedRecipes = response.documents;

      //   fetchedRecipes.forEach((recipe) => {
      //     const unixPublishDateTime = recipe.publishDate;
      //     recipe.publishDate = new Date(unixPublishDateTime * 1000);
      //   });
      // }
    } catch (error) {
      console.error(error.message);
      throw error;
    }

    return fetchedRecipes;
  };

  const handleFetchRecipes = async (cursorId = "") => {
    try {
      const fetchedRecipes = await fetchRecipes(cursorId);

      setRecipes(fetchedRecipes);
    } catch (error) {
      console.error(error.message);
      throw error;
    }
  };

  useEffect(() => {
    setIsLoading(true);

    fetchRecipes()
      .then((fetchedRecipes) => {
        setRecipes(fetchedRecipes);
      })
      .catch((error) => {
        console.error(error.message);
        throw error;
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, categoryFilter, orderBy, recipesPerPage]);

  FirebaseAuthService.subscribeToAuthChanges(setUser);

  const handleAddRecipe = async (newRecipe) => {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );
      // const response = await FirebaseFirestoreRestService.createDocument(
      //   "recipes",
      //   newRecipe
      // );

      // To-do: Fetch new recipes from firestore
      handleFetchRecipes();

      alert(`Successfully created a recipe with an ID: ${response.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    const deleteConfirmation = window.confirm(
      "Are you sure you want to delete this recipe? OK for Yes. Cancel for No."
    );

    if (deleteConfirmation) {
      try {
        await FirebaseFirestoreService.deleteDocument("recipes", recipeId);
        // await FirebaseFirestoreRestService.deleteDocument("recipes", recipeId);

        handleFetchRecipes();
        setCurrentRepice(null);
        window.scrollTo(0, 0);

        alert(`Successfully deleted a recipe with an ID: ${recipeId}`);
      } catch (error) {
        console.log(error.message);
        throw error;
      }
    }
  };

  const handleUpdateRecipe = async (newRecipe, recipeId) => {
    try {
      await FirebaseFirestoreService.updateDocument(
        "recipes",
        recipeId,
        newRecipe
      );
      // await FirebaseFirestoreRestService.updateDocument(
      //   "recipes",
      //   recipeId,
      //   newRecipe
      // );

      handleFetchRecipes();

      alert(`Successfully updated a recipe with an ID: ${recipeId}`);
      setCurrentRepice(null);
    } catch (error) {
      alert(error);
      throw error;
    }
  };

  const handleEditRecipeClick = (recipeId) => {
    const selectedRecipe = recipes.find((recipe) => recipe.id === recipeId);

    if (selectedRecipe) {
      setCurrentRepice(selectedRecipe);
      window.scrollTo(0, document.body.scrollHeight);
    }
  };

  const handleEditRecipeCancel = () => {
    setCurrentRepice(null);
  };

  const lookupCategoryLabel = (categoryKey) => {
    const categories = {
      breadsSandwichesAndPizza: "Breads, Sandwiches, and Pizza",
      eggsAndBreakfast: "Eggs & Breakfast",
      dessertsAndBakedGoods: "Desserts & Baked Goods",
      fishAndSeafood: "Fish & Seafood",
      vegetables: "Vegetables",
    };

    const label = categories[categoryKey];

    return label;
  };

  const formatDate = (date) => {
    const day = date.getUTCDate();
    const month = date.getUTCMonth() + 1;
    const year = date.getFullYear();
    const dateString = `${day.toString().padStart(2, "0")}/${month
      .toString()
      .padStart(2, "0")}/${year}`;

    return dateString;
  };

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user}></LoginForm>
      </div>
      <div className="main">
        <div className="row filters">
          <label className="recipe-label input-label">
            Category:
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="select"
              required
            >
              <option value=""></option>
              <option value="breadsSandwichesAndPizza">
                Breads, Sandwiches, and Pizza
              </option>
              <option value="eggsAndBreakfast">Eggs & Breakfast</option>
              <option value="dessertsAndBakedGoods">
                Desserts & Baked Goods
              </option>
              <option value="fishAndSeafood">Fish & Seafood</option>
              <option value="vegetables">Vegetables</option>
            </select>
          </label>
          <label className="input-label">
            <select
              value={orderBy}
              onChange={(event) => setOrderBy(event.target.value)}
              className="select"
            >
              <option value="publishDateDesc">
                Publish Date (Newest - Oldest)
              </option>
              <option value="publishDateAsc">
                Publish Date (Oldest - Newest)
              </option>
            </select>
          </label>
        </div>
        <div className="center">
          <div className="recipe-list-box">
            {isLoading && (
              <div className="fire">
                <div className="flames">
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                  <div className="flame"></div>
                </div>
                <div className="logs"></div>
              </div>
            )}
            {!isLoading && recipes && recipes.length === 0 && (
              <h5 className="no-recipes">No Recipes Found</h5>
            )}
            {!isLoading && recipes && recipes.length > 0 && (
              <div className="recipe-list">
                {recipes.map((recipe) => (
                  <div className="recipe-card" key={recipe.id}>
                    {!recipe.isPublished && (
                      <div className="unpublished">UNPUBLISHED</div>
                    )}
                    <div className="recipe-name">{recipe.name}</div>
                    <div className="recipe-image-box">
                      {recipe.imageUrl && (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="recipe-image"
                        />
                      )}
                    </div>
                    <div className="recipe-filed">
                      Category: {lookupCategoryLabel(recipe.category)}
                    </div>
                    <div className="recipe-filed">
                      Publish Date: {formatDate(recipe.publishDate)}
                    </div>
                    {user && (
                      <button
                        type="button"
                        onClick={() => handleEditRecipeClick(recipe.id)}
                        className="primary-button edit-button"
                      >
                        EDIT
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(isLoading || (recipes && recipes.length > 0)) && (
          <Fragment>
            <label className="input-label">
              Recipes Per Page:
              <select
                value={recipesPerPage}
                onChange={handleRecipesPerPageChange}
              >
                <option value="3">3</option>
                <option value="6">6</option>
                <option value="9">9</option>
              </select>
            </label>
            <div className="pagination">
              <button
                type="button"
                onClick={handleLoadMoreRecipesClick}
                className="primary-button"
              >
                LOAD MORE RECIPES
              </button>
              {/* <div className="row">
                <button
                  className={`primary-button${
                    currentPageNumber === 1 ? " hidden" : ""
                  }`}
                  type="button"
                  onClick={() => setCurrentPageNumber(currentPageNumber - 1)}
                >
                  Previous
                </button>
                <div>Page {currentPageNumber}</div>
                <button
                  className={`primary-button${isLastPage ? " hidden" : ""}`}
                  type="button"
                  onClick={() => setCurrentPageNumber(currentPageNumber + 1)}
                >
                  Next
                </button>
              </div>
              <div className="row">
                {!categoryFilter &&
                  new Array(totalNumberOfPages).fill(0).map((value, index) => {
                    return (
                      <button
                        key={index + 1}
                        type="button"
                        className={
                          currentPageNumber === index + 1
                            ? "selected-page primary-button page-button"
                            : "primary-button page-button"
                        }
                        onClick={() => setCurrentPageNumber(index + 1)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
              </div> */}
            </div>
          </Fragment>
        )}

        {user && (
          <AddEditRecipeForm
            handleAddRecipe={handleAddRecipe}
            existingRecipe={currentRecipe}
            handleUpdateRecipe={handleUpdateRecipe}
            handleDeleteRecipe={handleDeleteRecipe}
            handleEditRecipeCancel={handleEditRecipeCancel}
          />
        )}
      </div>
    </div>
  );
}

export default App;
