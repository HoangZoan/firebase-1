import { useState } from "react";
import "./App.css";
import FirebaseAuthService from "./FirebaseAuthService";
import FirebaseFirestoreService from "./FirebaseFirestoreService";
import LoginForm from "./components/LoginForm";
import AddEditRecipeForm from "./components/AddEditRecipeForm";

function App() {
  const [user, setUser] = useState(null);
  FirebaseAuthService.subscribeToAuthChanges(setUser);

  const handleAddRecipe = async (newRecipe) => {
    try {
      const response = await FirebaseFirestoreService.createDocument(
        "recipes",
        newRecipe
      );

      // To-do: Fetch new recipes from firestore

      alert(`Successfully created a recipe with an ID: ${response.id}`);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="App">
      <div className="title-row">
        <h1 className="title">Firebase Recipes</h1>
        <LoginForm existingUser={user}></LoginForm>
      </div>
      <div className="main">
        {user && <AddEditRecipeForm handleAddRecipe={handleAddRecipe} />}
      </div>
    </div>
  );
}

export default App;
