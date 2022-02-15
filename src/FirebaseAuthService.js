import firebase from "./FirebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";

const auth = firebase.auth;

const registerUser = (email, password) => {
  // return auth.createUserWithEmailAndPassword(email, password);
  return createUserWithEmailAndPassword(auth, email, password);
};

const loginUser = (email, password) => {
  // return auth.signInWithEmailAndPassword(email, password);
  return signInWithEmailAndPassword(auth, email, password);
};

const logoutUser = () => {
  return auth.signOut();
};

const loginWithGoogle = () => {
  // const provider = new firebase.auth.GoogleAuthProvider();
  const provider = new GoogleAuthProvider();
  // return auth.signInWithPopup(provider);
  return signInWithPopup(auth, provider);
};

const subscribeToAuthChanges = (handleAuthChange) => {
  // auth.onAuthStateChanged((user) => {
  //   handleAuthChange(user);
  // });
  onAuthStateChanged(auth, (user) => {
    handleAuthChange(user);
  });
};

const FirebaseAuthService = {
  registerUser,
  loginUser,
  logoutUser,
  // sendPasswordResetEmail,
  sendPasswordResetEmail: (email) => {
    sendPasswordResetEmail(auth, email);
  },
  loginWithGoogle,
  subscribeToAuthChanges,
};

export default FirebaseAuthService;
